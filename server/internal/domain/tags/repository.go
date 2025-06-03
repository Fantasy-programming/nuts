package tags

import (
	"context"
	"errors"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// Repository defines the interface for tag data operations
type Repository interface {
	// GetTags retrieves all tags for a specific user
	GetTags(ctx context.Context, userID uuid.UUID) ([]repository.GetTagsByUserIdRow, error)
	// GetTagByID retrieves a specific tag by its ID
	GetTagByID(ctx context.Context, id uuid.UUID) (repository.GetTagByIdRow, error)
	// CreateTag creates a new tag
	CreateTag(ctx context.Context, tag repository.CreateTagParams) (repository.Tag, error)
	// UpdateTag updates an existing tag
	UpdateTag(ctx context.Context, tag repository.UpdateTagParams) (repository.Tag, error)
	// DeleteTag deletes a tag
	DeleteTag(ctx context.Context, params repository.DeleteTagParams) error
}

type repo struct {
	queries *repository.Queries
}

// NewRepository creates a new tag repository
func NewRepository(queries *repository.Queries) Repository {
	return &repo{
		queries: queries,
	}
}

// GetTags retrieves all tags for a specific user
func (r *repo) GetTags(ctx context.Context, userID uuid.UUID) ([]repository.GetTagsByUserIdRow, error) {
	tags, err := r.queries.GetTagsByUserId(ctx, userID)
	if err != nil {
		// Special handling for empty results
		if errors.Is(err, pgx.ErrNoRows) {
			return []repository.GetTagsByUserIdRow{}, nil
		}
		return nil, err
	}
	return tags, nil
}

// GetTagByID retrieves a specific tag by its ID
func (r *repo) GetTagByID(ctx context.Context, id uuid.UUID) (repository.GetTagByIdRow, error) {
	return r.queries.GetTagById(ctx, id)
}

// CreateTag creates a new tag
func (r *repo) CreateTag(ctx context.Context, tag repository.CreateTagParams) (repository.Tag, error) {
	return r.queries.CreateTag(ctx, tag)
}

// UpdateTag updates an existing tag
func (r *repo) UpdateTag(ctx context.Context, tag repository.UpdateTagParams) (repository.Tag, error) {
	return r.queries.UpdateTag(ctx, tag)
}

// DeleteTag deletes a tag
func (r *repo) DeleteTag(ctx context.Context, params repository.DeleteTagParams) error {
	return r.queries.DeleteTag(ctx, params)
}
