package service

import (
	"context"
	"errors"
	"fmt"
	"math"
	"time"

	accRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/accounts/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/transactions"
	trscRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/transactions/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/transactions/rules"
	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/types"
	"github.com/Fantasy-Programming/nuts/server/pkg/llm"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
	"github.com/shopspring/decimal"
)

type Transactions interface {
	GetTransactions(ctx context.Context, params transactions.ListTransactionsParams, groupByDate bool) (*transactions.PaginatedTransactionsResponse, error)
	GetTransaction(ctx context.Context, id uuid.UUID) (repository.Transaction, error)

	CreateTransaction(ctx context.Context, params repository.CreateTransactionParams) (repository.Transaction, error)
	CreateTransfertTransaction(ctx context.Context, params transactions.TransfertParams) (repository.Transaction, error)
	UpdateTransaction(ctx context.Context, params repository.UpdateTransactionParams) (repository.Transaction, error)
	DeleteTransaction(ctx context.Context, id uuid.UUID) error

	// Bulk operations
	BulkDeleteTransactions(ctx context.Context, params repository.BulkDeleteTransactionsParams) error
	BulkUpdateTransactionCategories(ctx context.Context, params repository.BulkUpdateTransactionCategoriesParams) error
	BulkUpdateManualTransactions(ctx context.Context, params transactions.BulkUpdateManualTransactionsParams) error

	// Rules
	CreateRule(ctx context.Context, req transactions.CreateTransactionRuleRequest, userID uuid.UUID) (*transactions.TransactionRule, error)
	GetRule(ctx context.Context, id uuid.UUID) (*transactions.TransactionRule, error)
	ListRules(ctx context.Context, userID uuid.UUID) ([]transactions.TransactionRule, error)
	UpdateRule(ctx context.Context, id uuid.UUID, req transactions.UpdateTransactionRuleRequest, userID uuid.UUID) (*transactions.TransactionRule, error)
	DeleteRule(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
	ToggleRuleActive(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*transactions.TransactionRule, error)
	ApplyRulesToTransaction(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID) ([]transactions.RuleMatch, error)

	// Recurring
	CreateRecurringTransaction(ctx context.Context, req transactions.CreateRecurringTransactionRequest, userID uuid.UUID) (*transactions.RecurringTransaction, error)
	GetRecurringTransactionByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*transactions.RecurringTransaction, error)
	ListRecurringTransactions(ctx context.Context, userID uuid.UUID, filters transactions.RecurringTransactionFilters) ([]transactions.RecurringTransaction, error)
	UpdateRecurringTransaction(ctx context.Context, id uuid.UUID, req transactions.UpdateRecurringTransactionRequest, userID uuid.UUID) (*transactions.RecurringTransaction, error)
	DeleteRecurringTransaction(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
	PauseRecurringTransaction(ctx context.Context, id uuid.UUID, userID uuid.UUID, isPaused bool) (*transactions.RecurringTransaction, error)
	GetDueRecurringTransactions(ctx context.Context, dueDate time.Time) ([]transactions.RecurringTransaction, error)
	GetRecurringTransactionStats(ctx context.Context, userID uuid.UUID) (*transactions.RecurringTransactionStats, error)
	GetUpcomingRecurringTransactions(ctx context.Context, userID uuid.UUID, startDate, endDate time.Time) ([]transactions.RecurringTransaction, error)
	GetRecurringTransactionInstances(ctx context.Context, userID uuid.UUID, recurringID uuid.UUID) ([]repository.Transaction, error)

	// AI
	ParseTransactions(ctx context.Context, req llm.NeuralInputRequest) (*llm.NeuralInputResponse, error)
}

type TransactionService struct {
	trscRepo   trscRepo.Transactions
	accRepo    accRepo.Account
	llmService llm.Service
	db         *pgxpool.Pool
	evaluator  *rules.RuleEvaluator
	logger     *zerolog.Logger
}

func New(db *pgxpool.Pool, trscRepo trscRepo.Transactions, accRepo accRepo.Account, llm llm.Service, logger *zerolog.Logger) *TransactionService {
	return &TransactionService{
		trscRepo:   trscRepo,
		accRepo:    accRepo,
		llmService: llm,
		db:         db,
		evaluator:  rules.NewRuleEvaluator(),
		logger:     logger,
	}
}

func (t *TransactionService) GetTransactions(ctx context.Context, params transactions.ListTransactionsParams, groupByDate bool) (*transactions.PaginatedTransactionsResponse, error) {
	// 1. Get the total count for pagination metadata
	totalItems, err := t.trscRepo.CountTransactions(ctx, repository.CountTransactionsParams{
		UserID:     &params.UserID,
		Type:       params.Type,
		AccountID:  params.AccountID,
		CategoryID: params.CategoryID,
		Currency:   params.Currency,
		StartDate:  params.StartDate,
		EndDate:    params.EndDate,
		Search:     params.Search,
		IsExternal: params.IsExternal,
		MinAmount:  types.ToPgNumeric(params.MinAmount),
		MaxAmount:  types.ToPgNumeric(params.MaxAmount),
		Tags:       params.Tags,
	})
	if err != nil {
		return nil, err
	}

	// 2. Get the paginated list of transactions
	sqlcParams := repository.ListTransactionsParams{
		UserID:     &params.UserID,
		Limit:      int64(params.Limit),
		Offset:     int64((params.Page - 1) * params.Limit),
		Type:       params.Type,
		AccountID:  params.AccountID,
		CategoryID: params.CategoryID,
		Currency:   params.Currency,
		StartDate:  params.StartDate,
		EndDate:    params.EndDate,
		Search:     params.Search,
		IsExternal: params.IsExternal,
		MinAmount:  types.ToPgNumeric(params.MinAmount),
		MaxAmount:  types.ToPgNumeric(params.MaxAmount),

		Tags: params.Tags,
	}

	transactionsData, err := t.trscRepo.ListTransactions(ctx, sqlcParams)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &transactions.PaginatedTransactionsResponse{
				Data: []transactions.Group{},
				Pagination: transactions.Pagination{
					TotalItems: 0,
					TotalPages: 0,
					Page:       params.Page,
					Limit:      params.Limit,
				},
			}, nil
		}
		return nil, err
	}

	enhancedTransactions := make([]transactions.EnhancedTransaction, len(transactionsData))

	for i, t := range transactionsData {
		enhanced := transactions.EnhancedTransaction{
			ListTransactionsRow: t,
		}
		// If a destination account was found in the JOIN...
		if t.DestinationAccountIDAlias != nil {
			enhanced.DestinationAccount = &repository.GetAccountsRow{
				ID:       *t.DestinationAccountIDAlias,
				Name:     *t.DestinationAccountName,
				Type:     t.DestinationAccountType.ACCOUNTTYPE,
				Currency: *t.DestinationAccountCurrency,
			}
		}
		enhancedTransactions[i] = enhanced
	}

	resp := &transactions.PaginatedTransactionsResponse{
		Pagination: transactions.Pagination{
			TotalItems: int(totalItems),
			TotalPages: int(math.Ceil(float64(totalItems) / float64(params.Limit))),
			Page:       params.Page,
			Limit:      params.Limit,
		},
	}

	if groupByDate {
		grouped, err := groupEnhancedTransactions(enhancedTransactions)
		if err != nil {
			return nil, err
		}
		resp.Data = grouped
	} else {
		resp.Data = enhancedTransactions
	}

	return resp, nil
}

func (t *TransactionService) GetTransaction(ctx context.Context, id uuid.UUID) (repository.Transaction, error) {
	return t.trscRepo.GetTransaction(ctx, id)
}

func (t *TransactionService) CreateTransaction(ctx context.Context, params repository.CreateTransactionParams) (repository.Transaction, error) {
	tx, err := t.db.Begin(ctx)
	if err != nil {
		return repository.Transaction{}, err
	}

	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(ctx); rbErr != nil && !errors.Is(rbErr, pgx.ErrTxClosed) {
				fmt.Println("Failed to rollback")
			}
		}
	}()

	trxRepo := t.trscRepo.WithTx(tx)
	accRepo := t.accRepo.WithTx(tx)

	transaction, err := trxRepo.CreateTransaction(ctx, params)
	if err != nil {
		return repository.Transaction{}, err
	}

	err = accRepo.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
		ID:      params.AccountID,
		Balance: decimal.NewNullDecimal(params.Amount),
	})
	if err != nil {
		return repository.Transaction{}, err
	}

	// Commit the transaction
	if err = tx.Commit(ctx); err != nil {
		return repository.Transaction{}, err
	}

	// // Apply rules to the newly created transaction
	// if h.rulesService != nil {
	// 	err = h.rulesService.AutoApplyRulesToNewTransaction(ctx, transaction.ID, userID)
	// 	if err != nil {
	// 		// Log the error but don't fail the transaction creation
	// 		h.logger.Error().Err(err).Str("transaction_id", transaction.ID.String()).Msg("Failed to apply rules to transaction")
	// 	}
	// }

	return transaction, nil
}

func (t *TransactionService) UpdateTransaction(ctx context.Context, params repository.UpdateTransactionParams) (repository.Transaction, error) {
	tx, err := t.db.Begin(ctx)
	if err != nil {
		return repository.Transaction{}, err
	}

	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(ctx); rbErr != nil && !errors.Is(rbErr, pgx.ErrTxClosed) {
				fmt.Println("Failed to rollback")
			}
		}
	}()

	trxRepo := t.trscRepo.WithTx(tx)
	acxRepo := t.accRepo.WithTx(tx)

	// Get the original transaction
	originalTx, err := trxRepo.GetTransaction(ctx, params.ID)
	if err != nil {
		return repository.Transaction{}, err
	}

	// Reverse the original transaction amount on the original account
	reversalAmount := types.PgtypeNumericToDecimal(originalTx.Amount)

	err = acxRepo.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
		ID:      originalTx.AccountID,
		Balance: decimal.NewNullDecimal(reversalAmount.Neg()),
	})
	if err != nil {
		return repository.Transaction{}, err
	}

	// If it was a transfer, reverse the amount on the destination account as well
	if originalTx.DestinationAccountID != nil {
		// For transfers, the original amount was negative for the source and positive for the destination
		// So, to reverse, we add to the source (which we did) and subtract from the destination.
		reversalDestAmount := types.PgtypeNumericToDecimal(originalTx.Amount)

		err = acxRepo.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
			ID:      *originalTx.DestinationAccountID,
			Balance: decimal.NewNullDecimal(reversalDestAmount.Neg()),
		})
		if err != nil {
			return repository.Transaction{}, err
		}
	}

	// Update the transaction with the new details
	updatedTx, err := trxRepo.UpdateTransaction(ctx, params)
	if err != nil {
		return repository.Transaction{}, err
	}

	// Apply the new transaction amount to the new account
	newAmount := types.PgtypeNumericToDecimal(updatedTx.Amount)

	err = acxRepo.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
		ID:      updatedTx.AccountID,
		Balance: decimal.NewNullDecimal(newAmount),
	})
	if err != nil {
		return repository.Transaction{}, err
	}

	// If it's a new transfer, apply the amount to the new destination account
	if updatedTx.DestinationAccountID != nil {

		destAmount := types.PgtypeNumericToDecimal(updatedTx.Amount)
		// For transfers, the amount is negative for the source and positive for the destination

		err = acxRepo.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
			ID:      *updatedTx.DestinationAccountID,
			Balance: decimal.NewNullDecimal(destAmount.Neg()),
		})
		if err != nil {
			return repository.Transaction{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return repository.Transaction{}, err
	}

	return updatedTx, nil
}

func (t *TransactionService) CreateTransfertTransaction(ctx context.Context, params transactions.TransfertParams) (repository.Transaction, error) {
	tx, err := t.db.Begin(ctx)
	if err != nil {
		return repository.Transaction{}, err
	}

	defer func() {
		if rollbackErr := tx.Rollback(ctx); rollbackErr != nil && rollbackErr != pgx.ErrTxClosed {
			// r.logger.Error().Err(rollbackErr).Msg("Transaction rollback failed")
		}
	}()

	trxRepo := t.trscRepo.WithTx(tx)
	acxRepo := t.accRepo.WithTx(tx)

	sourceAcc, err := acxRepo.GetAccountByID(ctx, params.AccountID)

	if err != nil || *sourceAcc.CreatedBy != params.UserID {
		return repository.Transaction{}, transactions.ErrSrcAccNotFound
	}

	destAcc, err := acxRepo.GetAccountByID(ctx, params.DestinationAccountID)

	if err != nil || *destAcc.CreatedBy != params.UserID {
		return repository.Transaction{}, transactions.ErrDestAccNotFound
	}

	sourceBalanceDecimal := types.PgtypeNumericToDecimal(sourceAcc.Balance)
	newBalanceDecimal := sourceBalanceDecimal.Sub(params.Amount)

	if newBalanceDecimal.IsNegative() {
		return repository.Transaction{}, transactions.ErrLowBalance
	}

	// DECIMAL: The amount for the source account is negative.
	amountOutDecimal := params.Amount.Neg()
	// DECIMAL: The amount for the destination account is positive (it's the original params.Amount).
	amountInDecimal := params.Amount

	transaction, err := trxRepo.CreateTransaction(ctx, repository.CreateTransactionParams{
		Amount:               amountOutDecimal,
		Type:                 params.Type,
		AccountID:            params.AccountID,
		DestinationAccountID: &params.DestinationAccountID,
		CategoryID:           &params.CategoryID,
		Description:          params.Description,
		TransactionDatetime:  pgtype.Timestamptz{Time: params.TransactionDatetime, Valid: true},
		Details:              &params.Details,
		CreatedBy:            &params.UserID,
	})
	if err != nil {
		return repository.Transaction{}, err
	}

	err = acxRepo.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
		ID:      params.AccountID,
		Balance: decimal.NewNullDecimal(amountOutDecimal),
	})
	if err != nil {
		return repository.Transaction{}, err
	}

	err = acxRepo.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
		ID:      params.DestinationAccountID,
		Balance: decimal.NewNullDecimal(amountInDecimal),
	})
	if err != nil {
		return repository.Transaction{}, err
	}

	// Commit the transaction
	if err = tx.Commit(ctx); err != nil {
		return repository.Transaction{}, err
	}

	return transaction, nil
}

func (r *TransactionService) DeleteTransaction(ctx context.Context, id uuid.UUID) error {
	return r.trscRepo.DeleteTransaction(ctx, id)
}

func (r *TransactionService) BulkDeleteTransactions(ctx context.Context, params repository.BulkDeleteTransactionsParams) error {
	return r.trscRepo.BulkDeleteTransactions(ctx, params)
}

func (r *TransactionService) BulkUpdateTransactionCategories(ctx context.Context, params repository.BulkUpdateTransactionCategoriesParams) error {
	return r.trscRepo.BulkUpdateTransactionCategories(ctx, params)
}

func (r *TransactionService) BulkUpdateManualTransactions(ctx context.Context, params transactions.BulkUpdateManualTransactionsParams) error {
	var transactionDatetime pgtype.Timestamptz
	if params.TransactionDatetime != nil {
		transactionDatetime = pgtype.Timestamptz{Time: *params.TransactionDatetime, Valid: true}
	}

	return r.trscRepo.BulkUpdateManualTransactions(ctx, repository.BulkUpdateManualTransactionsParams{
		CategoryID:          params.CategoryID,
		AccountID:           params.AccountID,
		TransactionDatetime: transactionDatetime,
		UpdatedBy:           &params.UserID,
		Ids:                 params.Ids,
	})
}

func (r *TransactionService) ParseTransactions(ctx context.Context, req llm.NeuralInputRequest) (*llm.NeuralInputResponse, error) {
	return r.llmService.ParseTransactions(ctx, req)
}
