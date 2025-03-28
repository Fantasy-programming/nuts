package accounts

import (
	"context"
	"time"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// Repository defines the interface for account data operations
type Repository interface {
	// GetAccounts retrieves all accounts for a specific user
	GetAccounts(ctx context.Context, userID uuid.UUID) ([]repository.GetAccountsRow, error)
	// GetAccountByID retrieves a specific account by its ID
	GetAccountByID(ctx context.Context, id uuid.UUID) (repository.GetAccountByIdRow, error)
	// CreateAccount creates a new account
	CreateAccount(ctx context.Context, account repository.CreateAccountParams) (repository.Account, error)
	// UpdateAccount updates an existing account
	UpdateAccount(ctx context.Context, account repository.UpdateAccountParams) (repository.Account, error)
	// DeleteAccount marks an account as deleted
	DeleteAccount(ctx context.Context, id uuid.UUID) error
	// UpdateAccountBalance updates just the balance of an account
	UpdateAccountBalance(ctx context.Context, id uuid.UUID, amount pgtype.Numeric) error

	// GetAccountsBTimeline
	GetAccountsBTimeline(ctx context.Context, userID *uuid.UUID) ([]repository.GetAccountsBalanceTimelineRow, error)
	GetAccountBTimeline(ctx context.Context, id uuid.UUID) (repository.GetAccountBalanceTimelineRow, error)
	GetAccountsTrends(ctx context.Context, userID *uuid.UUID, startTime time.Time, endTime time.Time) ([]repository.GetAccountsWithTrendRow, error)
}

type repo struct {
	queries *repository.Queries
}

// NewRepository creates a new account repository
func NewRepository(queries *repository.Queries) Repository {
	return &repo{
		queries: queries,
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

func (r *repo) GetAccountBTimeline(ctx context.Context, id uuid.UUID) (repository.GetAccountBalanceTimelineRow, error) {
	return r.queries.GetAccountBalanceTimeline(ctx, id)
}

func (r *repo) GetAccountsTrends(ctx context.Context, userID *uuid.UUID, startTime time.Time, endTime time.Time) ([]repository.GetAccountsWithTrendRow, error) {
	params := repository.GetAccountsWithTrendParams{
		Column1: startTime,
		Column2: endTime,
		UserID:  userID,
	}

	return r.queries.GetAccountsWithTrend(ctx, params)
}
