package repository

import (
	"context"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository defines the interface for user data operations
type Users interface {
	WithTx(tx pgx.Tx) Users
	GetUserByEmail(ctx context.Context, email string) (repository.GetUserByEmailRow, error)
	GetUserByID(ctx context.Context, id uuid.UUID) (repository.GetUserByIdRow, error)
	CreateUser(ctx context.Context, params repository.CreateUserParams) (repository.User, error)
	UpdateUser(ctx context.Context, params repository.UpdateUserParams) (repository.User, error)
	DeleteUser(ctx context.Context, id uuid.UUID) error

	CreateDefaultPreferences(ctx context.Context, userID uuid.UUID) error
	// UpdateUserPassword(ctx context.Context, params repository.UpdateUserPasswordParams) error

	// Preferences
	GetUserPreferences(ctx context.Context, userID uuid.UUID) (repository.GetPreferencesByUserIdRow, error)
	UpdatePreferences(ctx context.Context, params repository.UpdatePreferencesParams) (repository.Preference, error)
}

type repo struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewRepository(db *pgxpool.Pool) *repo {
	queries := repository.New(db)

	return &repo{
		db:      db,
		queries: queries,
	}
}

func (r *repo) WithTx(tx pgx.Tx) Users {
	return &repo{queries: r.queries.WithTx(tx)}
}

func (r *repo) GetUserByEmail(ctx context.Context, email string) (repository.GetUserByEmailRow, error) {
	return r.queries.GetUserByEmail(ctx, email)
}

func (r *repo) GetUserByID(ctx context.Context, id uuid.UUID) (repository.GetUserByIdRow, error) {
	return r.queries.GetUserById(ctx, id)
}

func (r *repo) CreateUser(ctx context.Context, params repository.CreateUserParams) (repository.User, error) {
	return r.queries.CreateUser(ctx, params)
}

// UpdateUser updates an existing user
func (r *repo) UpdateUser(ctx context.Context, params repository.UpdateUserParams) (repository.User, error) {
	return r.queries.UpdateUser(ctx, params)
}

// UpdateUserPassword updates a user's password
// func (r *repo) UpdateUserPassword(ctx context.Context, params repository.UpdateUserPasswordParams) error {
// 	return r.queries.UpdateUserPassword(ctx, params)
// }

// DeleteUser deletes a user
func (r *repo) DeleteUser(ctx context.Context, id uuid.UUID) error {
	return r.queries.DeleteUser(ctx, id)
}

func (r *repo) CreateDefaultPreferences(ctx context.Context, userID uuid.UUID) error {
	return r.queries.CreateDefaultPreferences(ctx, userID)
}

func (r *repo) GetUserPreferences(ctx context.Context, userID uuid.UUID) (repository.GetPreferencesByUserIdRow, error) {
	return r.queries.GetPreferencesByUserId(ctx, userID)
}

func (r *repo) UpdatePreferences(ctx context.Context, params repository.UpdatePreferencesParams) (repository.Preference, error) {
	return r.queries.UpdatePreferences(ctx, params)
}
