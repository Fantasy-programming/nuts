package budgets

import (
	"context"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository defines the interface for budget data operations
type Repository interface {
	CreateBudget(ctx context.Context, params repository.CreateBudgetParams) (repository.CreateBudgetRow, error)
	// TODO: Uncomment these when SQLC generates the missing types
	// GetBudgetsByMode(ctx context.Context, params repository.GetBudgetsByModeParams) ([]repository.Budget, error)
	// GetUserBudgetSettings(ctx context.Context, params repository.GetUserBudgetSettingsParams) (repository.UserBudgetSetting, error)
	// CreateUserBudgetSettings(ctx context.Context, params repository.CreateUserBudgetSettingsParams) (repository.UserBudgetSetting, error)
	// UpdateUserBudgetSettings(ctx context.Context, params repository.UpdateUserBudgetSettingsParams) (repository.UserBudgetSetting, error)
	// GetBudgetTemplates(ctx context.Context) ([]repository.BudgetTemplate, error)
	// GetBudgetTemplate(ctx context.Context, id uuid.UUID) (repository.BudgetTemplate, error)
	// GetBudgetTemplateCategories(ctx context.Context, templateID uuid.UUID) ([]repository.BudgetTemplateCategory, error)
	// UpdateUserBudgetMode(ctx context.Context, params repository.UpdateUserBudgetModeParams) error
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

func (r *repo) CreateBudget(ctx context.Context, params repository.CreateBudgetParams) (repository.CreateBudgetRow, error) {
	return r.queries.CreateBudget(ctx, params)
}

// TODO: Implement these methods when SQLC generates the missing types
/*
func (r *repo) GetBudgetsByMode(ctx context.Context, params repository.GetBudgetsByModeParams) ([]repository.Budget, error) {
	return r.queries.GetBudgetsByMode(ctx, params)
}

func (r *repo) GetUserBudgetSettings(ctx context.Context, params repository.GetUserBudgetSettingsParams) (repository.UserBudgetSetting, error) {
	return r.queries.GetUserBudgetSettings(ctx, params)
}

func (r *repo) CreateUserBudgetSettings(ctx context.Context, params repository.CreateUserBudgetSettingsParams) (repository.UserBudgetSetting, error) {
	return r.queries.CreateUserBudgetSettings(ctx, params)
}

func (r *repo) UpdateUserBudgetSettings(ctx context.Context, params repository.UpdateUserBudgetSettingsParams) (repository.UserBudgetSetting, error) {
	return r.queries.UpdateUserBudgetSettings(ctx, params)
}

func (r *repo) GetBudgetTemplates(ctx context.Context) ([]repository.BudgetTemplate, error) {
	return r.queries.GetBudgetTemplates(ctx)
}

func (r *repo) GetBudgetTemplate(ctx context.Context, id uuid.UUID) (repository.BudgetTemplate, error) {
	return r.queries.GetBudgetTemplate(ctx, id)
}

func (r *repo) GetBudgetTemplateCategories(ctx context.Context, templateID uuid.UUID) ([]repository.BudgetTemplateCategory, error) {
	return r.queries.GetBudgetTemplateCategories(ctx, templateID)
}

func (r *repo) UpdateUserBudgetMode(ctx context.Context, params repository.UpdateUserBudgetModeParams) error {
	return r.queries.UpdateUserBudgetMode(ctx, params)
}
*/
