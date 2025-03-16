package categories

import (
	"context"
	"errors"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// Repository defines the interface for category data operations
type Repository interface {
	// ListCategories retrieves all categories for a specific user
	ListCategories(ctx context.Context, userID uuid.UUID) ([]repository.Category, error)
	// CreateCategory creates a new category
	CreateCategory(ctx context.Context, params repository.CreateCategoryParams) (repository.Category, error)
	// UpdateCategory updates an existing category
	UpdateCategory(ctx context.Context, params repository.UpdateCategoryParams) (repository.Category, error)
	// DeleteCategory deletes a category
	DeleteCategory(ctx context.Context, id uuid.UUID) error
}

type repo struct {
	queries *repository.Queries
}

// NewRepository creates a new categories repository
func NewRepository(queries *repository.Queries) Repository {
	return &repo{
		queries: queries,
	}
}

// ListCategories retrieves all categories for a specific user
func (r *repo) ListCategories(ctx context.Context, userID uuid.UUID) ([]repository.Category, error) {
	categories, err := r.queries.ListCategories(ctx, userID)
	if err != nil {
		// Special handling for empty results
		if errors.Is(err, pgx.ErrNoRows) {
			return []repository.Category{}, nil
		}
		return nil, err
	}
	return categories, nil
}

// CreateCategory creates a new category
func (r *repo) CreateCategory(ctx context.Context, params repository.CreateCategoryParams) (repository.Category, error) {
	return r.queries.CreateCategory(ctx, params)
}

// UpdateCategory updates an existing category
func (r *repo) UpdateCategory(ctx context.Context, params repository.UpdateCategoryParams) (repository.Category, error) {
	return r.queries.UpdateCategory(ctx, params)
}

// DeleteCategory deletes a category
func (r *repo) DeleteCategory(ctx context.Context, id uuid.UUID) error {
	return r.queries.DeleteCategory(ctx, id)
}
