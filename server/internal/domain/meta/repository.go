package meta

import (
	"context"

	"github.com/Fantasy-Programming/nuts/internal/repository"
)

// Repository defines the interface for metadata operations
type Repository interface {
	// GetCurrencies retrieves all supported currencies
	GetCurrencies(ctx context.Context) ([]repository.Currency, error)
}

type repo struct {
	queries *repository.Queries
}

// NewRepository creates a new meta repository
func NewRepository(queries *repository.Queries) Repository {
	return &repo{
		queries: queries,
	}
}

// GetCurrencies retrieves all supported currencies
func (r *repo) GetCurrencies(ctx context.Context) ([]repository.Currency, error) {
	return r.queries.GetCurrencies(ctx)
}
