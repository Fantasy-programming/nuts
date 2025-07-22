package service

import (
	"context"
	"errors"

	catRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/categories/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Category interface {
	ListCategories(ctx context.Context, userID uuid.UUID) ([]repository.Category, error)
	CreateCategory(ctx context.Context, params repository.CreateCategoryParams) (repository.Category, error)
	UpdateCategory(ctx context.Context, params repository.UpdateCategoryParams) (repository.Category, error)
	DeleteCategory(ctx context.Context, id uuid.UUID) error
}

type CategoryService struct {
	repo catRepo.Category
	db   *pgxpool.Pool
}

func New(db *pgxpool.Pool, repo catRepo.Category) *CategoryService {
	return &CategoryService{
		repo: repo,
		db:   db,
	}
}

func (r *CategoryService) ListCategories(ctx context.Context, userID uuid.UUID) ([]repository.Category, error) {
	categories, err := r.repo.ListCategories(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return []repository.Category{}, nil
		}
		return nil, err
	}

	return categories, nil
}

func (r *CategoryService) CreateCategory(ctx context.Context, params repository.CreateCategoryParams) (repository.Category, error) {
	return r.repo.CreateCategory(ctx, params)
}

func (r *CategoryService) UpdateCategory(ctx context.Context, params repository.UpdateCategoryParams) (repository.Category, error) {
	return r.repo.UpdateCategory(ctx, params)
}

func (r *CategoryService) DeleteCategory(ctx context.Context, id uuid.UUID) error {
	return r.repo.DeleteCategory(ctx, id)
}
