package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/accounts"
	accRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/accounts/repository"
	ctgRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/categories/repository"
	trcRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/transactions/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/repository/dto"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/encrypt"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/types"
	"github.com/Fantasy-Programming/nuts/server/pkg/finance"
	"github.com/Fantasy-Programming/nuts/server/pkg/jobs"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
	"github.com/shopspring/decimal"
)

type Account interface {
	ListAccounts(ctx context.Context, userID uuid.UUID) ([]repository.GetAccountsRow, error)
	GetAccount(ctx context.Context, accountID uuid.UUID) (repository.GetAccountByIdRow, error)
	CreateAccount(ctx context.Context, hasBalance bool, account repository.CreateAccountParams) (repository.Account, error)

	UpdateAccount(ctx context.Context, account repository.UpdateAccountParams) (repository.Account, error)
	DeleteAccount(ctx context.Context, id uuid.UUID) error

	GetAccountsBalanceTimeline(ctx context.Context, userID uuid.UUID) ([]repository.GetAccountsBalanceTimelineRow, error)
	GetAccountBalanceTimeline(ctx context.Context, userID uuid.UUID, accountID uuid.UUID) ([]repository.GetAccountBalanceTimelineRow, error)
	GetAccountsTrends(ctx context.Context, userID *uuid.UUID, startTime time.Time, endTime time.Time) ([]accounts.AccountWithTrend, error)

	// Linking
	LinkTeller(ctx context.Context, userID uuid.UUID, req accounts.TellerConnectRequest) error
	LinkMono(ctx context.Context, userID uuid.UUID, req accounts.MonoConnectRequest) error

	// Sync job management
	// CreateSyncJob(ctx context.Context, job FinancialSyncJob) (*FinancialSyncJob, error)
	// UpdateSyncJob(ctx context.Context, jobID uuid.UUID, updates map[string]interface{}) error
	// GetUserSyncJobs(ctx context.Context, userID uuid.UUID, limit int) ([]FinancialSyncJob, error)
}

type AccountService struct {
	repo               accRepo.Account
	trcRepo            trcRepo.Transactions
	ctgRepo            ctgRepo.Category
	db                 *pgxpool.Pool
	encrypt            *encrypt.Encrypter
	openFinanceManager *finance.ProviderManager
	scheduler          *jobs.Service
	logger             *zerolog.Logger
}

func New(db *pgxpool.Pool, encrypt *encrypt.Encrypter, opfn *finance.ProviderManager, scheduler *jobs.Service, repo accRepo.Account, trcRepo trcRepo.Transactions, ctgRepo ctgRepo.Category, logger *zerolog.Logger) *AccountService {
	return &AccountService{
		repo:               repo,
		trcRepo:            trcRepo,
		ctgRepo:            ctgRepo,
		db:                 db,
		encrypt:            encrypt,
		openFinanceManager: opfn,
		scheduler:          scheduler,
		logger:             logger,
	}
}

func (a *AccountService) ListAccounts(ctx context.Context, userID uuid.UUID) ([]repository.GetAccountsRow, error) {
	return a.repo.GetAccounts(ctx, userID)
}

func (a *AccountService) GetAccount(ctx context.Context, accountID uuid.UUID) (repository.GetAccountByIdRow, error) {
	return a.repo.GetAccountByID(ctx, accountID)
}

func (a *AccountService) CreateAccount(ctx context.Context, hasBalance bool, params repository.CreateAccountParams) (repository.Account, error) {
	tx, err := a.db.Begin(ctx)
	if err != nil {
		return repository.Account{}, err
	}

	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(ctx); rbErr != nil && !errors.Is(rbErr, pgx.ErrTxClosed) {
				fmt.Println("Failed to do things")
			}
		}
	}()

	actx := a.repo.WithTx(tx)
	tscx := a.trcRepo.WithTx(tx)
	ctgx := a.ctgRepo.WithTx(tx)

	// Create the account
	account, err := actx.CreateAccount(ctx, params)
	if err != nil {
		return repository.Account{}, err
	}

	if !hasBalance {
		if err = tx.Commit(ctx); err != nil {
			return repository.Account{}, err
		}
		return account, nil
	}

	// Category is set to income
	category, err := ctgx.GetCategoryByName(ctx, "Income")
	if err != nil {
		return repository.Account{}, err
	}

	description := "Initial Balance"
	medium := ""
	note := ""
	status := ""
	location := ""
	external := false

	// Create the initial transaction
	_, err = tscx.CreateTransaction(ctx, repository.CreateTransactionParams{
		Amount:              types.NullDecimalToDecimal(params.Balance),
		Type:                "income",
		AccountID:           account.ID,
		Description:         &description,
		CategoryID:          &category.ID,
		TransactionCurrency: account.Currency,
		IsExternal:          &external,
		OriginalAmount:      types.NullDecimalToDecimal(params.Balance),
		TransactionDatetime: pgtype.Timestamptz{Time: time.Now(), Valid: true},
		Details: &dto.Details{
			PaymentMedium: &medium,
			Location:      &location,
			Note:          &note,
			PaymentStatus: &status,
		},
		CreatedBy: account.CreatedBy,
	})
	if err != nil {
		return repository.Account{}, err
	}

	// Commit the transaction
	if err = tx.Commit(ctx); err != nil {
		return repository.Account{}, err
	}

	return account, nil
}

func (a *AccountService) GetAccountsBalanceTimeline(ctx context.Context, userID uuid.UUID) ([]repository.GetAccountsBalanceTimelineRow, error) {
	return a.repo.GetAccountsBTimeline(ctx, userID)
}

func (a *AccountService) GetAccountBalanceTimeline(ctx context.Context, userID uuid.UUID, accountID uuid.UUID) ([]repository.GetAccountBalanceTimelineRow, error) {
	return a.repo.GetAccountBTimeline(ctx, userID, accountID)
}

func (a *AccountService) GetAccountsTrends(ctx context.Context, userID *uuid.UUID, startTime time.Time, endTime time.Time) ([]accounts.AccountWithTrend, error) {
	return a.repo.GetAccountsTrends(ctx, userID, startTime, endTime)
}

func (a *AccountService) LinkTeller(ctx context.Context, userID uuid.UUID, req accounts.TellerConnectRequest) error {
	provider, err := a.openFinanceManager.GetProvider("teller")
	if err != nil {
		return err
	}

	accounts, err := provider.GetAccounts(ctx, req.AccessToken)
	if err != nil {
		return err
	}

	encryptedAccessToken, err := a.encrypt.Encrypt([]byte(req.AccessToken))
	if err != nil {
		return err
	}

	var institutionID, institutionName *string

	if len(accounts) > 0 {
		institutionID = &accounts[0].InstitutionID
		institutionName = &accounts[0].InstitutionName
	}

	status := "active"
	providerName := provider.GetProviderName()
	isExternal := true

	connParams := repository.CreateConnectionParams{
		UserID:               userID,
		ProviderName:         providerName,
		AccessTokenEncrypted: encryptedAccessToken,
		ItemID:               nil, // Teller itemId is the accessID
		InstitutionID:        institutionID,
		InstitutionName:      institutionName,
		Status:               &status,
		LastSyncAt:           pgtype.Timestamptz{Time: time.Now(), Valid: true},
		ExpiresAt:            pgtype.Timestamptz{Valid: false},
	}

	connection, err := a.repo.CreateConnection(ctx, connParams)
	if err != nil {
		return err
	}

	var createdAccounts []repository.Account
	var accountCreationErrors []error

	for _, providerAccount := range accounts {

		balance := decimal.NullDecimal{
			Decimal: decimal.NewFromFloat(providerAccount.Balance),
			Valid:   true,
		}

		newAccount, err := a.repo.CreateAccount(ctx, repository.CreateAccountParams{
			CreatedBy:         &userID,
			Name:              providerAccount.Name,
			Type:              providerAccount.Type,
			Balance:           balance,
			ProviderAccountID: &providerAccount.ProviderAccountID,
			ProviderName:      &providerName,
			IsExternal:        &isExternal,
			Currency:          providerAccount.Currency,
			ConnectionID:      &connection.ID,
			Meta: dto.AccountMeta{
				InstitutionName: req.Enrollment.Institution.Name,
			},
		})
		if err != nil {
			accountCreationErrors = append(accountCreationErrors, fmt.Errorf("account %s (%s): %w", providerAccount.Name, providerAccount.ID, err))
			continue
		}

		createdAccounts = append(createdAccounts, newAccount)
	}

	if len(accountCreationErrors) > 0 {
		a.logger.Warn().Errs("errors", accountCreationErrors).Msg("Some accounts could not be created from Teller")
	}

	if err = a.scheduler.EnqueueBankSync(ctx, userID, connection.ID, "full"); err != nil {
		a.logger.Error().Err(err).Msg("Failed to schedule bank sync")
	}

	return err
}

func (a *AccountService) LinkMono(ctx context.Context, userID uuid.UUID, req accounts.MonoConnectRequest) error {
	provider, err := a.openFinanceManager.GetProvider("mono")
	if err != nil {
		return err
	}

	exchangeResp, err := provider.ExchangePublicToken(ctx, finance.ExchangeTokenRequest{
		PublicToken: req.Code,
	})
	if err != nil {
		return err
	}

	monoItemID := exchangeResp.AccessToken
	providerName := "mono"
	status := "pending" // webhook will do

	encryptedMonoIdentifier, err := a.encrypt.Encrypt([]byte(monoItemID))
	if err != nil {
		return err
	}

	connParams := repository.CreateConnectionParams{
		UserID:               userID,
		ProviderName:         providerName,
		AccessTokenEncrypted: encryptedMonoIdentifier,
		ItemID:               nil,
		InstitutionID:        &req.InstitutionID,
		InstitutionName:      &req.Institution,
		Status:               &status,
		LastSyncAt:           pgtype.Timestamptz{Valid: false},
		ExpiresAt:            pgtype.Timestamptz{Valid: false},
	}

	_, err = a.repo.CreateConnection(ctx, connParams)

	return err
}

func (r *AccountService) UpdateAccount(ctx context.Context, account repository.UpdateAccountParams) (repository.Account, error) {
	return r.repo.UpdateAccount(ctx, account)
}

func (r *AccountService) DeleteAccount(ctx context.Context, id uuid.UUID) error {
	return r.repo.DeleteAccount(ctx, id)
}
