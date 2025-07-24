package budgets

import (
	"context"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository defines the interface for budget data operations
type Repository interface {
	CreateBudget(ctx context.Context, params repository.CreateBudgetParams) (repository.CreateBudgetRow, error)
	GetBudgetsByMode(ctx context.Context, userID uuid.UUID, mode BudgetMode) ([]Budget, error)
	GetUserBudgetSettings(ctx context.Context, userID uuid.UUID, sharedFinanceID *uuid.UUID) (*UserBudgetSettings, error)
	CreateOrUpdateUserBudgetSettings(ctx context.Context, userID uuid.UUID, mode BudgetMode, settings map[string]interface{}) (*UserBudgetSettings, error)
	GetBudgetTemplates(ctx context.Context) ([]BudgetTemplate, error)
	GetBudgetTemplate(ctx context.Context, id uuid.UUID) (*BudgetTemplate, error)
	GetBudgetTemplateCategories(ctx context.Context, templateID uuid.UUID) ([]BudgetTemplateCategory, error)
	UpdateUserBudgetMode(ctx context.Context, userID uuid.UUID, mode BudgetMode) error
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

func (r *repo) GetBudgetsByMode(ctx context.Context, userID uuid.UUID, mode BudgetMode) ([]Budget, error) {
	// For now, return empty slice - this would normally use SQLC generated queries
	return []Budget{}, nil
}

func (r *repo) GetUserBudgetSettings(ctx context.Context, userID uuid.UUID, sharedFinanceID *uuid.UUID) (*UserBudgetSettings, error) {
	// For now, return nil - this would normally use SQLC generated queries
	return nil, nil
}

func (r *repo) CreateOrUpdateUserBudgetSettings(ctx context.Context, userID uuid.UUID, mode BudgetMode, settings map[string]interface{}) (*UserBudgetSettings, error) {
	// For now, return a mock object - this would normally use SQLC generated queries
	now := time.Now()
	return &UserBudgetSettings{
		ID:              uuid.New(),
		UserID:          userID,
		SharedFinanceID: nil,
		BudgetMode:      mode,
		Settings:        settings,
		CreatedAt:       now,
		UpdatedAt:       now,
	}, nil
}

func (r *repo) GetBudgetTemplates(ctx context.Context) ([]BudgetTemplate, error) {
	// For now, return mock templates - this would normally use SQLC generated queries
	now := time.Now()
	return []BudgetTemplate{
		{
			ID:          uuid.New(),
			Name:        "50/30/20 Rule",
			Description: "Allocate 50% to needs, 30% to wants, 20% to savings",
			IsDefault:   true,
			CreatedAt:   now,
			UpdatedAt:   now,
		},
		{
			ID:          uuid.New(),
			Name:        "60/20/20 Rule",
			Description: "Allocate 60% to needs, 20% to wants, 20% to savings",
			IsDefault:   false,
			CreatedAt:   now,
			UpdatedAt:   now,
		},
		{
			ID:          uuid.New(),
			Name:        "70/20/10 Rule",
			Description: "Allocate 70% to needs, 20% to wants, 10% to savings",
			IsDefault:   false,
			CreatedAt:   now,
			UpdatedAt:   now,
		},
	}, nil
}

func (r *repo) GetBudgetTemplate(ctx context.Context, id uuid.UUID) (*BudgetTemplate, error) {
	// For now, return a mock template - this would normally use SQLC generated queries
	now := time.Now()
	return &BudgetTemplate{
		ID:          id,
		Name:        "50/30/20 Rule",
		Description: "Allocate 50% to needs, 30% to wants, 20% to savings",
		IsDefault:   true,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

func (r *repo) GetBudgetTemplateCategories(ctx context.Context, templateID uuid.UUID) ([]BudgetTemplateCategory, error) {
	// For now, return mock categories - this would normally use SQLC generated queries
	now := time.Now()
	return []BudgetTemplateCategory{
		{
			ID:           uuid.New(),
			TemplateID:   templateID,
			CategoryName: "Needs",
			Percentage:   50.00,
			Description:  "Essential expenses like housing, utilities, groceries",
			CreatedAt:    now,
		},
		{
			ID:           uuid.New(),
			TemplateID:   templateID,
			CategoryName: "Wants",
			Percentage:   30.00,
			Description:  "Non-essential expenses like entertainment, dining out",
			CreatedAt:    now,
		},
		{
			ID:           uuid.New(),
			TemplateID:   templateID,
			CategoryName: "Savings",
			Percentage:   20.00,
			Description:  "Emergency fund, retirement, and other savings goals",
			CreatedAt:    now,
		},
	}, nil
}

func (r *repo) UpdateUserBudgetMode(ctx context.Context, userID uuid.UUID, mode BudgetMode) error {
	// For now, return nil - this would normally use SQLC generated queries
	return nil
}
