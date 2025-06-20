package jobs

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/repository/dto"
	"github.com/Fantasy-Programming/nuts/server/internal/utility/encrypt"
	"github.com/Fantasy-Programming/nuts/server/internal/utility/types"
	"github.com/Fantasy-Programming/nuts/server/pkg/finance"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"
	"github.com/rs/zerolog"
)

type EmailJob struct {
	UserID    int64          `json:"user_id"`
	Email     string         `json:"email"`
	Template  string         `json:"template"`
	Variables map[string]any `json:"variables"`
}

func (EmailJob) Kind() string { return "email" }

type BankSyncJob struct {
	UserID       uuid.UUID `json:"user_id"`
	ConnectionID uuid.UUID `json:"connection_id"`
	SyncType     string    `json:"sync_type"` // "full" or "incremental"
}

func (BankSyncJob) Kind() string { return "bank_sync" }

type ExportJob struct {
	UserID     int64  `json:"user_id"`
	ExportType string `json:"export_type"` // "csv", "pdf", etc.
	DateRange  struct {
		From time.Time `json:"from"`
		To   time.Time `json:"to"`
	} `json:"date_range"`
}

func (ExportJob) Kind() string { return "export" }

type EmailWorker struct {
	river.WorkerDefaults[EmailJob]
	logger *zerolog.Logger
}

func (w *EmailWorker) Work(ctx context.Context, job *river.Job[EmailJob]) error {
	w.logger.Info().
		Int64("user_id", job.Args.UserID).
		Str("template", job.Args.Template).
		Msg("Processing email job")

	// Your email sending logic here
	// time.Sleep(2 * time.Second) // Simulate work

	return nil
}

type BankSyncWorkerDeps struct {
	DB             *pgxpool.Pool
	Queries        *repository.Queries
	encrypt        encrypt.Encrypter
	FinanceManager *finance.ProviderManager
	Logger         *zerolog.Logger
}

type BankSyncWorker struct {
	river.WorkerDefaults[BankSyncJob]
	deps *BankSyncWorkerDeps
}

// After adding an account, start a sync job that sync accounts & transactions for that connection then schedule a sync every day
func (w *BankSyncWorker) Work(ctx context.Context, job *river.Job[BankSyncJob]) error {
	w.deps.Logger.Info().
		Any("user_id", job.Args.UserID).
		Any("connection_id", job.Args.ConnectionID).
		Str("sync_type", job.Args.SyncType).
		Msg("Starting bank sync job")

		// Get user's connection details
	connection, err := w.deps.Queries.GetConnectionByID(ctx, job.Args.ConnectionID)
	if err != nil {
		w.deps.Logger.Error().Err(err).Msg("Failed to get connection")
		return fmt.Errorf("failed to get connection: %w", err)
	}

	// Get the appropriate finance provider
	provider, err := w.deps.FinanceManager.GetProvider(connection.ProviderName)
	if err != nil {
		w.deps.Logger.Error().Err(err).Str("provider", connection.ProviderName).Msg("Failed to get provider")
		return fmt.Errorf("failed to get provider: %w", err)
	}

	// Start transaction for atomic sync
	tx, err := w.deps.DB.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		if rbErr := tx.Rollback(ctx); rbErr != nil && !errors.Is(rbErr, pgx.ErrTxClosed) {
			w.deps.Logger.Error().Err(rbErr).Msg("Failed to roll the transaction")
		}
	}()

	qtx := w.deps.Queries.WithTx(tx)

	// Sync accounts first
	if err := w.syncAccounts(ctx, qtx, provider, connection, job.Args.UserID); err != nil {
		return fmt.Errorf("failed to sync accounts: %w", err)
	}

	// Sync transactions
	if err := w.syncTransactions(ctx, qtx, provider, connection, job.Args.UserID, job.Args.SyncType); err != nil {
		return fmt.Errorf("failed to sync transactions: %w", err)
	}

	// Update last sync time
	if _, err := qtx.SetConnectionSyncStatus(ctx, repository.SetConnectionSyncStatusParams{
		ID:         job.Args.ConnectionID,
		UserID:     job.Args.UserID,
		LastSyncAt: pgtype.Timestamptz{Valid: true, Time: time.Now()},
	}); err != nil {
		return fmt.Errorf("failed to update last sync time: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit sync transaction: %w", err)
	}

	w.deps.Logger.Info().
		Any("user_id", job.Args.UserID).
		Str("sync_type", job.Args.SyncType).
		Msg("Bank sync completed successfully")

	return nil
}

// syncAccounts syncs account data from provider
func (w *BankSyncWorker) syncAccounts(ctx context.Context, qtx *repository.Queries, provider finance.Provider, connection repository.UserFinancialConnection, userID uuid.UUID) error {
	decryptedToken, err := w.deps.encrypt.Decrypt(connection.AccessTokenEncrypted)
	if err != nil {
		return fmt.Errorf("failed to decrypt access token: %w", err)
	}

	// Get all accounts of this connection from provider
	accounts, err := provider.GetAccounts(ctx, string(decryptedToken))
	if err != nil {
		return fmt.Errorf("failed to get accounts from provider: %w", err)
	}

	if len(accounts) == 0 {
		return nil
	}

	existingAccounts, err := qtx.GetAccountsByConnectionID(ctx, repository.GetAccountsByConnectionIDParams{
		CreatedBy:    &userID,
		ConnectionID: &connection.ID,
	})
	if err != nil {
		return fmt.Errorf("failed to get existing accounts: %w", err)
	}

	existingAccountMap := make(map[string]repository.GetAccountsByConnectionIDRow)
	for _, acc := range existingAccounts {
		if acc.ProviderAccountID != nil {
			existingAccountMap[*acc.ProviderAccountID] = acc
		}
	}

	var accountsToCreate []repository.BatchCreateAccountParams
	var accountsToUpdate []repository.UpdateAccountParams

	for _, account := range accounts {
		newBalance := types.Numeric(account.Balance)
		isExternal := true

		// At my knowledge, there wont be new accounts

		if existingAccount, exists := existingAccountMap[account.ProviderAccountID]; exists {
			// Account exists, prepare for update
			accountsToUpdate = append(accountsToUpdate, repository.UpdateAccountParams{
				ID:      existingAccount.ID,
				Name:    &account.Name,
				Balance: newBalance,
			})
		} else {
			// Account doesn't exist, prepare for creation
			accountsToCreate = append(accountsToCreate, repository.BatchCreateAccountParams{
				Name:              account.Name,
				Balance:           newBalance,
				Type:              account.Type,
				Currency:          account.Currency,
				ProviderName:      &connection.ProviderName,
				ProviderAccountID: &account.ProviderAccountID,
				ConnectionID:      &connection.ID,
				CreatedBy:         &userID,
				IsExternal:        &isExternal,
			})
		}
	}

	// Execute batch operations
	if len(accountsToCreate) > 0 {
		if _, err := qtx.BatchCreateAccount(ctx, accountsToCreate); err != nil {
			return fmt.Errorf("failed to batch create accounts: %w", err)
		}
	}

	if len(accountsToUpdate) > 0 {
		if err := w.batchUpdateAccounts(ctx, qtx, accountsToUpdate); err != nil {
			return fmt.Errorf("failed to batch update accounts: %w", err)
		}
	}

	return nil
}

// syncTransactions syncs transaction data from provider for a user
func (w *BankSyncWorker) syncTransactions(ctx context.Context, qtx *repository.Queries, provider finance.Provider, connection repository.UserFinancialConnection, userID uuid.UUID, syncType string) error {
	// Get user's accounts with that connection
	accounts, err := qtx.GetAccountsByConnectionID(ctx, repository.GetAccountsByConnectionIDParams{
		CreatedBy:    &userID,
		ConnectionID: &connection.ID,
	})
	if err != nil {
		return fmt.Errorf("failed to get user accounts: %w", err)
	}

	// Pre-load category cache
	categoryCache, err := w.buildCategoryCache(ctx, qtx, userID)
	if err != nil {
		return fmt.Errorf("failed to build category cache: %w", err)
	}

	for _, account := range accounts {
		if err := w.syncAccountTransactions(ctx, qtx, provider, connection, account, syncType, categoryCache, userID); err != nil {
			w.deps.Logger.Error().Err(err).Str("account_id", account.ID.String()).Msg("Failed to sync account transactions")
			continue // Continue with other accounts
		}
	}

	return nil
}

// Sync transactions for a single account with optimizations
func (w *BankSyncWorker) syncAccountTransactions(ctx context.Context, qtx *repository.Queries, provider finance.Provider, connection repository.UserFinancialConnection, account repository.GetAccountsByConnectionIDRow, syncType string, categoryCache map[string]uuid.UUID, userID uuid.UUID) error {
	decryptedToken, err := w.deps.encrypt.Decrypt(connection.AccessTokenEncrypted)
	if err != nil {
		return fmt.Errorf("failed to decrypt access token: %w", err)
	}

	// Get transactions from provider
	var transactions []finance.Transaction

	if syncType == "full" {
		transactions, err = provider.GetTransactions(ctx, string(decryptedToken), *account.ProviderAccountID, finance.GetTransactionsArgs{})
	} else {
		transactions, err = provider.GetRecentTransactions(ctx, string(decryptedToken), *account.ProviderAccountID, 100)
	}

	if err != nil {
		return fmt.Errorf("failed to get transactions from provider: %w", err)
	}

	if len(transactions) == 0 {
		return nil
	}

	w.deps.Logger.Info().
		Int("count", len(transactions)).
		Str("account_id", *account.ProviderAccountID).
		Msg("Syncing transactions")

	// Get existing transactions for this account (batch lookup)
	existingTransactions, err := qtx.ListTransactionsByAccount(ctx, account.ID)
	if err != nil {
		return fmt.Errorf("failed to get existing transactions: %w", err)
	}

	// Create existence map for O(1) lookups
	existingTxnMap := make(map[string]bool)
	for _, txn := range existingTransactions {
		if txn.ProviderTransactionID != nil {
			existingTxnMap[*txn.ProviderTransactionID] = true
		}
	}

	// Prepare batch insert
	var transactionsToCreate []repository.BatchCreateTransactionParams

	for _, transaction := range transactions {
		// Skip if transaction already exists
		if existingTxnMap[transaction.ProviderTransactionID] {
			continue
		}

		// Determine transaction type
		transactionType := "expense"
		if transaction.Amount > 0 {
			transactionType = "income"
		}

		// Get category ID from cache (or create if needed)
		categoryID, err := w.getCategoryIDFromCache(ctx, qtx, categoryCache, userID, *transaction.Category)
		if err != nil {
			w.deps.Logger.Error().Err(err).Str("category", *transaction.Category).Msg("Failed to get category")
			continue
		}

		amount := types.Numeric(transaction.Amount)
		isExternal := true

		transactionsToCreate = append(transactionsToCreate, repository.BatchCreateTransactionParams{
			Amount:                amount,
			Type:                  transactionType,
			AccountID:             account.ID,
			CategoryID:            &categoryID,
			TransactionDatetime:   pgtype.Timestamptz{Valid: true, Time: transaction.Date},
			Description:           &transaction.Description,
			ProviderTransactionID: &transaction.ProviderTransactionID,
			Details:               dto.Details{},
			CreatedBy:             &userID,
			IsExternal:            &isExternal,
		})
	}

	// Batch insert transactions
	if len(transactionsToCreate) > 0 {
		val, err := qtx.BatchCreateTransaction(ctx, transactionsToCreate)
		if err != nil {
			return fmt.Errorf("failed to batch create transactions: %w", err)
		}
		w.deps.Logger.Info().Int64("created", val).Msg("Created new transactions")
	}

	return nil
}

func (w *BankSyncWorker) buildCategoryCache(ctx context.Context, qtx *repository.Queries, userID uuid.UUID) (map[string]uuid.UUID, error) {
	categories, err := qtx.ListCategories(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user categories: %w", err)
	}

	cache := make(map[string]uuid.UUID)
	for _, category := range categories {
		cache[category.Name] = category.ID
	}

	return cache, nil
}

// Get category ID from cache, create if doesn't exist
func (w *BankSyncWorker) getCategoryIDFromCache(ctx context.Context, qtx *repository.Queries, cache map[string]uuid.UUID, userID uuid.UUID, categoryName string) (uuid.UUID, error) {
	// Check cache first
	if categoryID, exists := cache[categoryName]; exists {
		return categoryID, nil
	}

	isDefault := false

	// Create new category
	category, err := qtx.CreateCategory(ctx, repository.CreateCategoryParams{
		Name:      categoryName,
		CreatedBy: userID,
		IsDefault: &isDefault,
	})
	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to create category: %w", err)
	}

	// Add to cache for future use
	cache[categoryName] = category.ID
	return category.ID, nil
}

// Batch update accounts
func (w *BankSyncWorker) batchUpdateAccounts(ctx context.Context, qtx *repository.Queries, accounts []repository.UpdateAccountParams) error {
	for _, account := range accounts {
		_, err := qtx.UpdateAccount(ctx, account)
		if err != nil {
			return fmt.Errorf("failed to update account: %w", err)
		}
	}
	return nil
}

type ExportWorker struct {
	river.WorkerDefaults[ExportJob]
	logger *zerolog.Logger
}

func (w *ExportWorker) Work(ctx context.Context, job *river.Job[ExportJob]) error {
	w.logger.Info().
		Int64("user_id", job.Args.UserID).
		Str("export_type", job.Args.ExportType).
		Msg("Processing export job")

	// Your export generation logic here

	return nil
}

type ExchangeRatesWorkerDeps struct {
	DB      *pgxpool.Pool
	Queries *repository.Queries
	Logger  *zerolog.Logger
}

// Historical Exchange Rate Job for backfilling data
type HistoricalExchangeRateJob struct {
	BaseCurrency string    `json:"base_currency"`
	StartDate    time.Time `json:"start_date"`
	EndDate      time.Time `json:"end_date"`
}

func (HistoricalExchangeRateJob) Kind() string {
	return "historical_exchange_rate_update"
}

type HistoricalExchangeRateWorker struct {
	river.WorkerDefaults[HistoricalExchangeRateJob]
	deps *ExchangeRatesWorkerDeps
}

func (w *HistoricalExchangeRateWorker) Work(ctx context.Context, job *river.Job[HistoricalExchangeRateJob]) error {
	logger := w.deps.Logger.With().
		Str("job_kind", job.Kind).
		Str("job_id", fmt.Sprintf("%d", job.ID)).
		Logger()

	logger.Info().
		Time("start_date", job.Args.StartDate).
		Time("end_date", job.Args.EndDate).
		Msg("Starting historical exchange rate update job")

	// Process each day in the range
	currentDate := job.Args.StartDate

	for currentDate.Before(job.Args.EndDate) || currentDate.Equal(job.Args.EndDate) {
		// Check if we already have rates for this date
		exists, err := w.deps.Queries.ExchangeRateExistsForDate(ctx, repository.ExchangeRateExistsForDateParams{
			FromCurrency:  job.Args.BaseCurrency,
			EffectiveDate: pgtype.Date{Valid: true, Time: currentDate},
		})
		if err != nil {
			logger.Error().Err(err).Time("date", currentDate).Msg("Failed to check existing rates")
			currentDate = currentDate.AddDate(0, 0, 1)
			continue
		}

		if exists {
			logger.Debug().Time("date", currentDate).Msg("Exchange rates already exist for date")
			currentDate = currentDate.AddDate(0, 0, 1)
			continue
		}

		// Fetch historical rates for this date
		rates, err := w.fetchHistoricalExchangeRates(ctx, job.Args.BaseCurrency, currentDate)
		if err != nil {
			logger.Error().Err(err).Time("date", currentDate).Msg("Failed to fetch historical rates")
			currentDate = currentDate.AddDate(0, 0, 1)
			continue
		}

		// Store rates
		for toCurrency, rate := range rates {
			err := w.deps.Queries.UpsertExchangeRate(ctx, repository.UpsertExchangeRateParams{
				FromCurrency:  job.Args.BaseCurrency,
				ToCurrency:    toCurrency,
				Rate:          types.Numeric(rate),
				EffectiveDate: pgtype.Date{Time: currentDate, Valid: true},
			})
			if err != nil {
				logger.Error().Err(err).
					Str("from_currency", job.Args.BaseCurrency).
					Str("to_currency", toCurrency).
					Time("date", currentDate).
					Msg("Failed to store historical exchange rate")
			}
		}

		currentDate = currentDate.AddDate(0, 0, 1)

		// Reduced delay since there are no rate limits
		time.Sleep(50 * time.Millisecond)
	}

	logger.Info().Msg("Historical exchange rate update job completed")
	return nil
}

func (w *HistoricalExchangeRateWorker) fetchHistoricalExchangeRates(ctx context.Context, baseCurrency string, date time.Time) (map[string]float64, error) {
	// Using the free GitHub currency API for historical data
	dateStr := date.Format("2006-01-02")
	url := fmt.Sprintf("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@%s/v1/currencies/%s.json",
		dateStr, strings.ToLower(baseCurrency))

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status: %d", resp.StatusCode)
	}

	// Parse the response as a generic map first to handle the dynamic structure
	var rawResult map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&rawResult); err != nil {
		return nil, err
	}

	// Extract the rates from the nested structure
	baseCurrencyLower := strings.ToLower(baseCurrency)
	ratesInterface, ok := rawResult[baseCurrencyLower]
	if !ok {
		return nil, fmt.Errorf("no rates found for base currency: %s", baseCurrency)
	}

	ratesMap, ok := ratesInterface.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("unexpected rates format")
	}

	// Convert to map[string]float64
	rates := make(map[string]float64)
	for currency, rateInterface := range ratesMap {
		if rate, ok := rateInterface.(float64); ok {
			rates[strings.ToUpper(currency)] = rate
		}
	}

	return rates, nil
}

type ExchangeRatesSyncJob struct {
	JobDate time.Time `json:"job_date"`
}

func (ExchangeRatesSyncJob) Kind() string {
	return "exchange_rates_sync"
}

type ExchangeRatesSyncWorker struct {
	river.WorkerDefaults[ExchangeRatesSyncJob]
	deps *ExchangeRatesWorkerDeps
}

func (w *ExchangeRatesSyncWorker) Work(ctx context.Context, job *river.Job[ExchangeRatesSyncJob]) error {
	logger := w.deps.Logger.With().
		Str("job_kind", job.Kind).
		Int64("job_id", job.ID).
		Time("job_date", job.Args.JobDate).
		Logger()

	logger.Info().Msg("Starting exchange rates sync")

	currencies, err := w.deps.Queries.GetCurrencies(ctx)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to fetch currencies")
		return fmt.Errorf("failed to fetch currencies: %w", err)
	}

	if len(currencies) == 0 {
		logger.Warn().Msg("No currencies found in database")
		return nil
	}

	logger.Info().Int("currency_count", len(currencies)).Msg("Found currencies to sync")

	var successCount, failureCount int

	// Process each currency
	for _, currency := range currencies {
		currencyLogger := logger.With().Str("currency", currency.Code).Logger()

		if err := w.syncCurrencyRates(ctx, currency.Code, job.Args.JobDate, &currencyLogger); err != nil {
			currencyLogger.Error().Err(err).Msg("Failed to sync exchange rates for currency")
			failureCount++
			continue
		}

		currencyLogger.Info().Msg("Successfully synced exchange rates for currency")
		successCount++
	}

	logger.Info().
		Int("success_count", successCount).
		Int("failure_count", failureCount).
		Int("total_currencies", len(currencies)).
		Msg("Completed bulk exchange rate sync")

	// TODO: Decide when to fail the job
	if failureCount > 0 && successCount == 0 {
		return fmt.Errorf("failed to sync exchange rates for all %d currencies", len(currencies))
	}

	return nil
}

// TODO: Filter out errors (crypto stuffs)
func (w *ExchangeRatesSyncWorker) syncCurrencyRates(ctx context.Context, baseCurrency string, jobDate time.Time, logger *zerolog.Logger) error {
	logger.Info().Msg("Fetching exchange rates from provider")

	// Fetch exchange rates
	rates, err := fetchExchangeRates(ctx, baseCurrency)
	if err != nil {
		return fmt.Errorf("failed to fetch exchange rates: %w", err)
	}

	for targetCurrency, rate := range rates {
		err := w.deps.Queries.UpsertExchangeRate(ctx, repository.UpsertExchangeRateParams{
			FromCurrency:  baseCurrency,
			ToCurrency:    targetCurrency,
			Rate:          types.Numeric(rate),
			EffectiveDate: pgtype.Date{Valid: true, Time: jobDate},
		})
		if err != nil {
			logger.Error().Err(err).
				Str("from_currency", baseCurrency).
				Str("to_currency", targetCurrency).
				Msg("Failed to store exchange rate")
			continue
		}

	}

	logger.Info().Msg("Exchange rates synced successfully")
	return nil
}

// Timeout returns how long the job can run before timing out (10 min here)
func (w *ExchangeRatesSyncWorker) Timeout(job *river.Job[ExchangeRatesSyncJob]) time.Duration {
	return 10 * time.Minute
}

// NextRetry determines when to retry a failed job (1h here)
func (w *ExchangeRatesSyncWorker) NextRetry(job *river.Job[ExchangeRatesSyncJob]) time.Time {
	return time.Now().Add(1 * time.Hour)
}
