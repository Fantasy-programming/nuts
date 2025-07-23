package repository

import (
	"context"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Auth interface {
	WithTx(tx pgx.Tx) Auth

	GetMFASecret(ctx context.Context, userID uuid.UUID) ([]byte, error)
	EnableMFA(ctx context.Context, id uuid.UUID) error
	StoreMFASecret(ctx context.Context, params repository.StoreMFASecretParams) error
	DisableMFA(ctx context.Context, userID uuid.UUID) error

	GetLinkedAccounts(ctx context.Context, id uuid.UUID) ([]repository.GetLinkedAccountsRow, error)
	AddLinkedAccounts(ctx context.Context, params repository.AddLinkedAccountParams) error
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

func (r *repo) WithTx(tx pgx.Tx) Auth {
	return &repo{queries: r.queries.WithTx(tx)}
}

func (r *repo) GetLinkedAccounts(ctx context.Context, id uuid.UUID) ([]repository.GetLinkedAccountsRow, error) {
	return r.queries.GetLinkedAccounts(ctx, id)
}

func (r *repo) AddLinkedAccounts(ctx context.Context, params repository.AddLinkedAccountParams) error {
	return r.queries.AddLinkedAccount(ctx, params)
}

func (r *repo) StoreMFASecret(ctx context.Context, params repository.StoreMFASecretParams) error {
	return r.queries.StoreMFASecret(ctx, params)
}

func (r *repo) GetMFASecret(ctx context.Context, userID uuid.UUID) ([]byte, error) {
	return r.queries.GetMFASecret(ctx, userID)
}

func (r *repo) EnableMFA(ctx context.Context, userID uuid.UUID) error {
	return r.queries.EnableMFA(ctx, userID)
}

func (r *repo) DisableMFA(ctx context.Context, userID uuid.UUID) error {
	return r.queries.DisableMFA(ctx, userID)
}
