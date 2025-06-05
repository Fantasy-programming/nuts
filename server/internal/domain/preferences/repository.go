package preferences

import (
	"context"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/google/uuid"
)

// Repository defines the interface for user preferences data operations
type Repository interface {
	// GetPreferencesByUserId retrieves preferences for a specific user
	GetPreferencesByUserId(ctx context.Context, userID uuid.UUID) (repository.GetPreferencesByUserIdRow, error)
	// UpdatePreferences updates a user's preferences
	UpdatePreferences(ctx context.Context, params repository.UpdatePreferencesParams) (repository.Preference, error)
}

type repo struct {
	queries *repository.Queries
}

// NewRepository creates a new preferences repository
func NewRepository(queries *repository.Queries) Repository {
	return &repo{
		queries: queries,
	}
}

// GetPreferencesByUserId retrieves preferences for a specific user
func (r *repo) GetPreferencesByUserId(ctx context.Context, userID uuid.UUID) (repository.GetPreferencesByUserIdRow, error) {
	return r.queries.GetPreferencesByUserId(ctx, userID)
}

// UpdatePreferences updates a user's preferences
func (r *repo) UpdatePreferences(ctx context.Context, params repository.UpdatePreferencesParams) (repository.Preference, error) {
	return r.queries.UpdatePreferences(ctx, params)
}
