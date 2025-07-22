package repository

import (
	"context"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/transactions"
	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Transactions interface {
	WithTx(tx pgx.Tx) Transactions

	// Transaction operations
	CountTransactions(ctx context.Context, params repository.CountTransactionsParams) (int64, error)
	ListTransactions(ctx context.Context, arg repository.ListTransactionsParams) ([]repository.ListTransactionsRow, error)

	GetTransaction(ctx context.Context, id uuid.UUID) (repository.Transaction, error)
	CreateTransaction(ctx context.Context, params repository.CreateTransactionParams) (repository.Transaction, error)
	UpdateTransaction(ctx context.Context, params repository.UpdateTransactionParams) (repository.Transaction, error)
	DeleteTransaction(ctx context.Context, id uuid.UUID) error

	// Bulk operations
	BulkDeleteTransactions(ctx context.Context, params repository.BulkDeleteTransactionsParams) error
	BulkUpdateTransactionCategories(ctx context.Context, params repository.BulkUpdateTransactionCategoriesParams) error
	BulkUpdateManualTransactions(ctx context.Context, params repository.BulkUpdateManualTransactionsParams) error

	// Rules
	CreateRule(ctx context.Context, params CreateRuleParams) (*transactions.TransactionRule, error)
	GetRuleByID(ctx context.Context, id uuid.UUID) (*transactions.TransactionRule, error)
	ListRules(ctx context.Context, userID uuid.UUID) ([]transactions.TransactionRule, error)
	ListActiveRules(ctx context.Context, userID uuid.UUID) ([]transactions.TransactionRule, error)
	UpdateRule(ctx context.Context, params UpdateRuleParams) (*transactions.TransactionRule, error)
	DeleteRule(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
	ToggleRuleActive(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*transactions.TransactionRule, error)
}

type repo struct {
	db      *pgxpool.Pool
	Queries *repository.Queries
}

func NewRepository(db *pgxpool.Pool) *repo {
	queries := repository.New(db)

	return &repo{
		db:      db,
		Queries: queries,
	}
}

func (r *repo) WithTx(tx pgx.Tx) Transactions {
	return &repo{Queries: r.Queries.WithTx(tx)}
}

func (r *repo) CountTransactions(ctx context.Context, arg repository.CountTransactionsParams) (int64, error) {
	return r.Queries.CountTransactions(ctx, arg)
}

func (r *repo) ListTransactions(ctx context.Context, arg repository.ListTransactionsParams) ([]repository.ListTransactionsRow, error) {
	return r.Queries.ListTransactions(ctx, arg)
}

func (r *repo) GetTransaction(ctx context.Context, id uuid.UUID) (repository.Transaction, error) {
	return r.Queries.GetTransactionById(ctx, id)
}

func (r *repo) CreateTransaction(ctx context.Context, params repository.CreateTransactionParams) (repository.Transaction, error) {
	return r.Queries.CreateTransaction(ctx, params)
}

func (r *repo) UpdateTransaction(ctx context.Context, params repository.UpdateTransactionParams) (repository.Transaction, error) {
	return r.Queries.UpdateTransaction(ctx, params)
}

func (r *repo) DeleteTransaction(ctx context.Context, id uuid.UUID) error {
	return r.Queries.DeleteTransaction(ctx, id)
}

func (r *repo) BulkDeleteTransactions(ctx context.Context, params repository.BulkDeleteTransactionsParams) error {
	return r.Queries.BulkDeleteTransactions(ctx, params)
}

func (r *repo) BulkUpdateTransactionCategories(ctx context.Context, params repository.BulkUpdateTransactionCategoriesParams) error {
	return r.Queries.BulkUpdateTransactionCategories(ctx, params)
}

func (r *repo) BulkUpdateManualTransactions(ctx context.Context, params repository.BulkUpdateManualTransactionsParams) error {
	return r.Queries.BulkUpdateManualTransactions(ctx, params)
}
