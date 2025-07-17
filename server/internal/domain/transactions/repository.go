package transactions

import (
	"context"
	"errors"
	"fmt"
	"math"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/repository/dto"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/types"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
)

type Repository interface {
	// Transaction operations
	GetTransactions(ctx context.Context, params ListTransactionsParams, groupByDate bool) (*PaginatedTransactionsResponse, error)
	GetTransaction(ctx context.Context, id uuid.UUID) (repository.Transaction, error)
	CreateTransaction(ctx context.Context, params repository.CreateTransactionParams) (repository.Transaction, error)
	CreateTransfertTransaction(ctx context.Context, params TransfertParams) (repository.Transaction, error)
	UpdateTransaction(ctx context.Context, params repository.UpdateTransactionParams) (repository.Transaction, error)
	DeleteTransaction(ctx context.Context, id uuid.UUID) error

	// Bulk operations
	BulkDeleteTransactions(ctx context.Context, ids []uuid.UUID, userID uuid.UUID) error
	BulkUpdateTransactionCategories(ctx context.Context, ids []uuid.UUID, categoryID uuid.UUID, userID uuid.UUID) error
	BulkUpdateManualTransactions(ctx context.Context, params BulkUpdateManualTransactionsParams) error

	// Transaction stats
	// GetTransactionsStats(ctx context.Context, params repository.GetTransactionStatsParams) (repository.GetTransactionStatsRow, error)
}

type Trsrepo struct {
	DB      *pgxpool.Pool
	Queries *repository.Queries
}

func NewRepository(db *pgxpool.Pool, queries *repository.Queries) Repository {
	return &Trsrepo{
		DB:      db,
		Queries: queries,
	}
}

func (r *Trsrepo) GetTransactions(ctx context.Context, params ListTransactionsParams, groupByDate bool) (*PaginatedTransactionsResponse, error) {
	// 1. Get the total count for pagination metadata
	totalItems, err := r.Queries.CountTransactions(ctx, repository.CountTransactionsParams{
		UserID:     &params.UserID,
		Type:       params.Type,
		AccountID:  params.AccountID,
		CategoryID: params.CategoryID,
		Currency:   params.Currency,
		StartDate:  params.StartDate,
		EndDate:    params.EndDate,
		Search:     params.Search,
		IsExternal: params.IsExternal,
		MinAmount:  params.MinAmount,
		MaxAmount:  params.MaxAmount,
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
		MinAmount:  params.MinAmount,
		MaxAmount:  params.MaxAmount,
		Tags:       params.Tags,
	}

	transactions, err := r.Queries.ListTransactions(ctx, sqlcParams)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &PaginatedTransactionsResponse{
				Data: []Group{}, // Return empty slice
				Pagination: Pagination{
					TotalItems: 0,
					TotalPages: 0,
					Page:       params.Page,
					Limit:      params.Limit,
				},
			}, nil
		}
		return nil, err
	}

	enhancedTransactions := make([]EnhancedTransaction, len(transactions))

	for i, t := range transactions {
		enhanced := EnhancedTransaction{
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

	resp := &PaginatedTransactionsResponse{
		Pagination: Pagination{
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
		resp.Data = enhancedTransactions // Return the flat, enhanced list
	}

	return resp, nil
}

// GetTransaction retrieves a specific transaction by its ID
func (r *Trsrepo) GetTransaction(ctx context.Context, id uuid.UUID) (repository.Transaction, error) {
	return r.Queries.GetTransactionById(ctx, id)
}

// CreateTransaction creates a new transaction
func (r *Trsrepo) CreateTransaction(ctx context.Context, params repository.CreateTransactionParams) (repository.Transaction, error) {
	tx, err := r.DB.Begin(ctx)
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

	qtx := r.Queries.WithTx(tx)

	transaction, err := qtx.CreateTransaction(ctx, params)
	if err != nil {
		return repository.Transaction{}, err
	}

	err = qtx.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
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

	return transaction, nil
}

func (r *Trsrepo) CreateTransactionClean(ctx context.Context, params repository.CreateTransactionParams) (repository.Transaction, error) {
	return r.Queries.CreateTransaction(ctx, params)
}

// UpdateTransaction updates an existing transaction
func (r *Trsrepo) UpdateTransaction(ctx context.Context, params repository.UpdateTransactionParams) (repository.Transaction, error) {
	tx, err := r.DB.Begin(ctx)
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

	qtx := r.Queries.WithTx(tx)

	// Get the original transaction
	originalTx, err := qtx.GetTransactionById(ctx, params.ID)
	if err != nil {
		return repository.Transaction{}, err
	}

	// Reverse the original transaction amount on the original account
	reversalAmount := types.PgtypeNumericToDecimal(originalTx.Amount)

	err = qtx.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
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
		err = qtx.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
			ID:      *originalTx.DestinationAccountID,
			Balance: decimal.NewNullDecimal(reversalDestAmount.Neg()),
		})
		if err != nil {
			return repository.Transaction{}, err
		}
	}

	// Update the transaction with the new details
	updatedTx, err := qtx.UpdateTransaction(ctx, params)
	if err != nil {
		return repository.Transaction{}, err
	}

	// Apply the new transaction amount to the new account
	newAmount := types.PgtypeNumericToDecimal(updatedTx.Amount)
	err = qtx.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
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
		err = qtx.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
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

// DeleteTransaction deletes a transaction
func (r *Trsrepo) DeleteTransaction(ctx context.Context, id uuid.UUID) error {
	return r.Queries.DeleteTransaction(ctx, id)
}

// TransfertParams holds parameters for creating a transfer transaction
type TransfertParams struct {
	Amount               decimal.Decimal
	Type                 string
	AccountID            uuid.UUID
	DestinationAccountID uuid.UUID
	CategoryID           uuid.UUID
	Description          *string
	TransactionCurrency  string
	OriginalAmount       decimal.Decimal
	TransactionDatetime  time.Time
	Details              dto.Details
	UserID               uuid.UUID
}

// CreateTransfertTransaction handles the creation of a transfer transaction between accounts
func (r *Trsrepo) CreateTransfertTransaction(ctx context.Context, params TransfertParams) (repository.Transaction, error) {
	tx, err := r.DB.Begin(ctx)
	if err != nil {
		return repository.Transaction{}, err
	}

	defer func() {
		if rollbackErr := tx.Rollback(ctx); rollbackErr != nil && rollbackErr != pgx.ErrTxClosed {
			// r.logger.Error().Err(rollbackErr).Msg("Transaction rollback failed")
		}
	}()

	qtx := r.Queries.WithTx(tx)

	sourceAcc, err := qtx.GetAccountById(ctx, params.AccountID)

	if err != nil || *sourceAcc.CreatedBy != params.UserID {
		return repository.Transaction{}, ErrSrcAccNotFound
	}

	destAcc, err := qtx.GetAccountById(ctx, params.DestinationAccountID)

	if err != nil || *destAcc.CreatedBy != params.UserID {
		return repository.Transaction{}, ErrDestAccNotFound
	}

	sourceBalanceDecimal := types.PgtypeNumericToDecimal(sourceAcc.Balance)
	newBalanceDecimal := sourceBalanceDecimal.Sub(params.Amount)

	if newBalanceDecimal.IsNegative() {
		return repository.Transaction{}, ErrLowBalance
	}

	// DECIMAL: The amount for the source account is negative.
	amountOutDecimal := params.Amount.Neg()
	// DECIMAL: The amount for the destination account is positive (it's the original params.Amount).
	amountInDecimal := params.Amount

	transaction, err := qtx.CreateTransaction(ctx, repository.CreateTransactionParams{
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

	err = qtx.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
		ID:      params.AccountID,
		Balance: decimal.NewNullDecimal(amountOutDecimal),
	})
	if err != nil {
		return repository.Transaction{}, err
	}

	err = qtx.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
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

// BulkUpdateManualTransactionsParams holds parameters for bulk updating manual transactions
type BulkUpdateManualTransactionsParams struct {
Ids                 []uuid.UUID
CategoryID          *uuid.UUID
AccountID           *uuid.UUID
TransactionDatetime *time.Time
UserID              uuid.UUID
}

// BulkDeleteTransactions deletes multiple transactions
func (r *Trsrepo) BulkDeleteTransactions(ctx context.Context, ids []uuid.UUID, userID uuid.UUID) error {
return r.Queries.BulkDeleteTransactions(ctx, repository.BulkDeleteTransactionsParams{
Ids:    ids,
UserID: userID,
})
}

// BulkUpdateTransactionCategories updates categories for multiple transactions
func (r *Trsrepo) BulkUpdateTransactionCategories(ctx context.Context, ids []uuid.UUID, categoryID uuid.UUID, userID uuid.UUID) error {
return r.Queries.BulkUpdateTransactionCategories(ctx, repository.BulkUpdateTransactionCategoriesParams{
CategoryID: categoryID,
UpdatedBy:  userID,
Ids:        ids,
})
}

// BulkUpdateManualTransactions updates multiple manual transactions (non-external)
func (r *Trsrepo) BulkUpdateManualTransactions(ctx context.Context, params BulkUpdateManualTransactionsParams) error {
var transactionDatetime pgtype.Timestamptz
if params.TransactionDatetime != nil {
transactionDatetime = pgtype.Timestamptz{Time: *params.TransactionDatetime, Valid: true}
}

return r.Queries.BulkUpdateManualTransactions(ctx, repository.BulkUpdateManualTransactionsParams{
CategoryID:          params.CategoryID,
AccountID:           params.AccountID,
TransactionDatetime: transactionDatetime,
UpdatedBy:           params.UserID,
Ids:                 params.Ids,
})
}
