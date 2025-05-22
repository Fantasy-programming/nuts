package accounts

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/repository/dto"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository defines the interface for account data operations
type Repository interface {
	// GetAccounts retrieves all accounts for a specific user
	GetAccounts(ctx context.Context, userID uuid.UUID) ([]repository.GetAccountsRow, error)
	// GetAccountByID retrieves a specific account by its ID
	GetAccountByID(ctx context.Context, id uuid.UUID) (repository.GetAccountByIdRow, error)
	// CreateAccount creates a new account
	CreateAccount(ctx context.Context, account repository.CreateAccountParams) (repository.Account, error)
	CreateAccountWInitalTrs(ctx context.Context, act repository.CreateAccountParams) (repository.Account, error)

	// UpdateAccount updates an existing account
	UpdateAccount(ctx context.Context, account repository.UpdateAccountParams) (repository.Account, error)
	// DeleteAccount marks an account as deleted
	DeleteAccount(ctx context.Context, id uuid.UUID) error
	// UpdateAccountBalance updates just the balance of an account
	UpdateAccountBalance(ctx context.Context, id uuid.UUID, amount pgtype.Numeric) error

	// GetAccountsBTimeline
	GetAccountsBTimeline(ctx context.Context, userID *uuid.UUID) ([]repository.GetAccountsBalanceTimelineRow, error)
	GetAccountBTimeline(ctx context.Context, id uuid.UUID) ([]repository.GetAccountBalanceTimelineRow, error)
	GetAccountsTrends(ctx context.Context, userID *uuid.UUID, startTime time.Time, endTime time.Time) ([]AccountWithTrend, error)
}

type repo struct {
	queries *repository.Queries
	db      *pgxpool.Pool
}

// NewRepository creates a new account repository
func NewRepository(queries *repository.Queries, db *pgxpool.Pool) Repository {
	return &repo{
		queries: queries,
		db:      db,
	}
}

// GetAccounts retrieves all accounts for a specific user
func (r *repo) GetAccounts(ctx context.Context, userID uuid.UUID) ([]repository.GetAccountsRow, error) {
	return r.queries.GetAccounts(ctx, &userID)
}

// GetAccountByID retrieves a specific account by its ID
func (r *repo) GetAccountByID(ctx context.Context, id uuid.UUID) (repository.GetAccountByIdRow, error) {
	return r.queries.GetAccountById(ctx, id)
}

// CreateAccount creates a new account
func (r *repo) CreateAccount(ctx context.Context, account repository.CreateAccountParams) (repository.Account, error) {
	return r.queries.CreateAccount(ctx, account)
}

func (r *repo) CreateAccountWInitalTrs(ctx context.Context, act repository.CreateAccountParams) (repository.Account, error) {
	tx, err := r.db.Begin(ctx)
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

	qtx := r.queries.WithTx(tx)

	// Create the account
	account, err := qtx.CreateAccount(ctx, act)
	if err != nil {
		return repository.Account{}, err
	}

	// Category is set to income
	category, err := qtx.GetCategoryByName(ctx, "Income")
	if err != nil {
		return repository.Account{}, err
	}

	description := "Initial Balance"

	// Create the initial transaction
	_, err = qtx.CreateTransaction(ctx, repository.CreateTransactionParams{
		Amount:              act.Balance,
		Type:                "income",
		AccountID:           account.ID,
		Description:         &description,
		CategoryID:          category.ID,
		TransactionDatetime: time.Now(),
		Details: dto.Details{
			PaymentMedium: "",
			Location:      "",
			Note:          "",
			PaymentStatus: "",
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

// UpdateAccount updates an existing account
func (r *repo) UpdateAccount(ctx context.Context, account repository.UpdateAccountParams) (repository.Account, error) {
	return r.queries.UpdateAccount(ctx, account)
}

// DeleteAccount marks an account as deleted
func (r *repo) DeleteAccount(ctx context.Context, id uuid.UUID) error {
	return r.queries.DeleteAccount(ctx, id)
}

// UpdateAccountBalance updates just the balance of an account
func (r *repo) UpdateAccountBalance(ctx context.Context, id uuid.UUID, amount pgtype.Numeric) error {
	params := repository.UpdateAccountBalanceParams{
		ID:      id,
		Balance: amount,
	}
	return r.queries.UpdateAccountBalance(ctx, params)
}

func (r *repo) GetAccountsBTimeline(ctx context.Context, userID *uuid.UUID) ([]repository.GetAccountsBalanceTimelineRow, error) {
	return r.queries.GetAccountsBalanceTimeline(ctx, userID)
}

func (r *repo) GetAccountBTimeline(ctx context.Context, id uuid.UUID) ([]repository.GetAccountBalanceTimelineRow, error) {
	return r.queries.GetAccountBalanceTimeline(ctx, id)
}

func (r *repo) GetAccountsTrends(ctx context.Context, userID *uuid.UUID, startTime time.Time, endTime time.Time) ([]AccountWithTrend, error) {
	rows, err := r.db.Query(ctx, getAccountsWithTrendSQL, startTime, endTime, userID)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var results []AccountWithTrend
	for rows.Next() {
		var rawTimeseries json.RawMessage
		var a AccountWithTrend
		err := rows.Scan(
			&a.ID, &a.Name, &a.Type, &a.Balance, &a.Currency,
			&a.Color, &a.Meta, &a.UpdatedAt, &a.Trend, &rawTimeseries,
		)
		if err != nil {
			return nil, err
		}
		if err := json.Unmarshal(rawTimeseries, &a.BalanceTimeseries); err != nil {
			return nil, err
		}
		results = append(results, a)
	}
	return results, nil
}
