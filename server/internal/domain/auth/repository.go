package auth

import (
	"context"
	"errors"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository defines the interface for auth-related data operations
type Repository interface {
	// GetUserByEmail retrieves a user by their email address
	GetUserByEmail(ctx context.Context, email string) (repository.GetUserByEmailRow, error)
	// CreateUser creates a new user
	CreateUser(ctx context.Context, params repository.CreateUserParams) (repository.User, error)
	// CreateUserWithDefaults creates a new user and sets up their default categories in a transaction
	CreateUserWithDefaults(ctx context.Context, params repository.CreateUserParams) (repository.User, error)
}

type repo struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

// NewRepository creates a new auth repository
func NewRepository(db *pgxpool.Pool, queries *repository.Queries) Repository {
	return &repo{
		db:      db,
		queries: queries,
	}
}

// GetUserByEmail retrieves a user by their email address
func (r *repo) GetUserByEmail(ctx context.Context, email string) (repository.GetUserByEmailRow, error) {
	return r.queries.GetUserByEmail(ctx, email)
}

// CreateUser creates a new user
func (r *repo) CreateUser(ctx context.Context, params repository.CreateUserParams) (repository.User, error) {
	return r.queries.CreateUser(ctx, params)
}

// CreateUserWithDefaults creates a new user and sets up their default categories in a transaction
func (r *repo) CreateUserWithDefaults(ctx context.Context, params repository.CreateUserParams) (repository.User, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return repository.User{}, err
	}

	// Ensure transaction is rolled back on error
	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(ctx); rbErr != nil && !errors.Is(rbErr, pgx.ErrTxClosed) {
				// Log the rollback error, but return the original error
				// Consider adding structured logging here
			}
		}
	}()

	qtx := r.queries.WithTx(tx)

	user, err := qtx.CreateUser(ctx, params)
	if err != nil {
		return repository.User{}, err
	}

	// Create default categories
	err = qtx.CreateDefaultCategories(ctx, user.ID)
	if err != nil {
		return repository.User{}, err
	}

	// Commit the transaction
	if err = tx.Commit(ctx); err != nil {
		return repository.User{}, err
	}

	return user, nil
}
