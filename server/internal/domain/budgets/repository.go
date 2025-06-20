package budgets

import (
	"context"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository defines the interface for account data operations
type Repository interface {
	CreateBudget(ctx context.Context, params repository.CreateBudgetParams) (repository.CreateBudgetRow, error)
}

type repo struct {
	queries *repository.Queries
	db      *pgxpool.Pool
}

func NewRepository(queries *repository.Queries, db *pgxpool.Pool) Repository {
	return &repo{
		queries: queries,
		db:      db,
	}
}

// GetAccounts retrieves all accounts for a specific user
func (r *repo) CreateBudget(ctx context.Context, params repository.CreateBudgetParams) (repository.CreateBudgetRow, error) {
	return r.queries.CreateBudget(ctx, params)
}
