package repository

import (
	"context"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Category interface {
	WithTx(tx pgx.Tx) Category

	ListCategories(ctx context.Context, userID uuid.UUID) ([]repository.Category, error)
	CreateCategory(ctx context.Context, params repository.CreateCategoryParams) (repository.Category, error)
	UpdateCategory(ctx context.Context, params repository.UpdateCategoryParams) (repository.Category, error)
	DeleteCategory(ctx context.Context, id uuid.UUID) error

	CreateDefaultCategories(ctx context.Context, userID uuid.UUID) error
	GetCategoryByName(ctx context.Context, name string) (repository.Category, error)
}

type repo struct {
	queries *repository.Queries
}

func NewRepository(db *pgxpool.Pool) *repo {
	queries := repository.New(db)
	return &repo{
		queries: queries,
	}
}

func (r *repo) WithTx(tx pgx.Tx) Category {
	return &repo{queries: r.queries.WithTx(tx)}
}

func (r *repo) ListCategories(ctx context.Context, userID uuid.UUID) ([]repository.Category, error) {
	return r.queries.ListCategories(ctx, userID)
}

func (r *repo) CreateCategory(ctx context.Context, params repository.CreateCategoryParams) (repository.Category, error) {
	return r.queries.CreateCategory(ctx, params)
}

func (r *repo) UpdateCategory(ctx context.Context, params repository.UpdateCategoryParams) (repository.Category, error) {
	return r.queries.UpdateCategory(ctx, params)
}

func (r *repo) DeleteCategory(ctx context.Context, id uuid.UUID) error {
	return r.queries.DeleteCategory(ctx, id)
}

func (r *repo) GetCategoryByName(ctx context.Context, name string) (repository.Category, error) {
	return r.queries.GetCategoryByName(ctx, name)
}

func (r *repo) CreateDefaultCategories(ctx context.Context, userID uuid.UUID) error {
	return r.queries.CreateDefaultCategories(ctx, userID)
}
