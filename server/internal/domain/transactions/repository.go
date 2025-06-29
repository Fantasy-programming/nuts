package transactions

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/repository/dto"
	"github.com/Fantasy-Programming/nuts/server/internal/utility/types"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	// Transaction operations
	GetTransactions(ctx context.Context, params repository.ListTransactionsParams) ([]Group, error)
	GetTransaction(ctx context.Context, id uuid.UUID) (repository.Transaction, error)
	CreateTransaction(ctx context.Context, params repository.CreateTransactionParams) (repository.Transaction, error)
	CreateTransfertTransaction(ctx context.Context, params TransfertParams) (repository.Transaction, error)
	UpdateTransaction(ctx context.Context, params repository.UpdateTransactionParams) (repository.Transaction, error)
	DeleteTransaction(ctx context.Context, id uuid.UUID) error

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

func (r *Trsrepo) GetTransactions(ctx context.Context, params repository.ListTransactionsParams) ([]Group, error) {
	transactions, err := r.Queries.ListTransactions(ctx, params)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return []Group{}, nil
		}
		return nil, err
	}

	accounts, err := r.Queries.GetAccounts(ctx, params.UserID)
	if err != nil {
		return nil, err
	}

	// Create account map for faster lookups
	accountMap := createAccountMap(accounts)

	// Enhance transactions with destination account data
	enhancedTransactions := enhanceTransactionsWithDestAccounts(transactions, accountMap)

	// Group the enhanced transactions
	grouped, err := groupEnhancedTransactions(enhancedTransactions)
	if err != nil {
		return nil, err
	}

	return grouped, nil
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
		Balance: params.Amount,
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
	return r.Queries.UpdateTransaction(ctx, params)
}

// DeleteTransaction deletes a transaction
func (r *Trsrepo) DeleteTransaction(ctx context.Context, id uuid.UUID) error {
	return r.Queries.DeleteTransaction(ctx, id)
}

// TransfertParams holds parameters for creating a transfer transaction
type TransfertParams struct {
	Amount               float64
	Type                 string
	AccountID            uuid.UUID
	DestinationAccountID uuid.UUID
	CategoryID           uuid.UUID
	Description          *string
	TransactionDatetime  time.Time
	Details              dto.Details
	UserID               uuid.UUID
}

// CreateTransfertTransaction handles the creation of a transfer transaction between accounts
func (r *Trsrepo) CreateTransfertTransaction(ctx context.Context, params TransfertParams) (repository.Transaction, error) {
	// Start transaction
	tx, err := r.DB.Begin(ctx)
	if err != nil {
		return repository.Transaction{}, err
	}

	defer func() {
		if rollbackErr := tx.Rollback(ctx); rollbackErr != nil && rollbackErr != pgx.ErrTxClosed {
			// Log the rollback error

			fmt.Println("Transaction rollback failed")
			// r.Logger.Error().Err(rollbackErr).Msg("Transaction rollback failed")
		}
	}()

	qtx := r.Queries.WithTx(tx)

	// Verify accounts exist and belong to user
	sourceAcc, err := qtx.GetAccountById(ctx, params.AccountID)
	if err != nil || *sourceAcc.CreatedBy != params.UserID {
		return repository.Transaction{}, ErrSrcAccNotFound
	}

	destAcc, err := qtx.GetAccountById(ctx, params.DestinationAccountID)
	if err != nil || *destAcc.CreatedBy != params.UserID {
		return repository.Transaction{}, ErrDestAccNotFound
	}

	// Check sufficient balance
	amountOut := types.Numeric(-params.Amount)
	newBalance := sourceAcc.Balance
	newBalance.Int = new(big.Int).Add(newBalance.Int, amountOut.Int)
	if newBalance.Int == nil || newBalance.Int.Sign() < 0 {
		return repository.Transaction{}, ErrLowBalance
	}

	// Create the transfer transaction
	amountIn := types.Numeric(params.Amount)
	transaction, err := qtx.CreateTransaction(ctx, repository.CreateTransactionParams{
		Amount:               amountOut,
		Type:                 params.Type,
		AccountID:            params.AccountID,
		DestinationAccountID: &params.DestinationAccountID,
		CategoryID:           params.CategoryID,
		Description:          params.Description,
		TransactionDatetime:  pgtype.Timestamptz{Time: params.TransactionDatetime, Valid: true},
		Details:              params.Details,
		CreatedBy:            &params.UserID,
	})
	if err != nil {
		return repository.Transaction{}, err
	}

	// Update account balances
	err = qtx.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
		ID:      params.AccountID,
		Balance: amountOut,
	})
	if err != nil {
		return repository.Transaction{}, err
	}

	err = qtx.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
		ID:      params.DestinationAccountID,
		Balance: amountIn,
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
