package budgets

import (
	"time"

	"github.com/google/uuid"
)

// BudgetMode represents different budgeting approaches
type BudgetMode string

const (
	BudgetModeTraditionalCategory BudgetMode = "traditional_category" // Traditional category-based budgets
	BudgetModeFlexBucket         BudgetMode = "flex_bucket"          // Single flexible spending pool
	BudgetModeGlobalLimit        BudgetMode = "global_limit"         // Simple total spending cap
	BudgetModeZeroBased          BudgetMode = "zero_based"           // Every dollar must be assigned
	BudgetModePercentageBased    BudgetMode = "percentage_based"     // 50/30/20 rule and similar frameworks
)

type Budget struct {
	ID                   uuid.UUID  `json:"id"`
	UserID               uuid.UUID  `json:"user_id"`
	SharedFinanceID      *uuid.UUID `json:"shared_finance_id,omitempty"` // Nullable
	CategoryID           uuid.UUID  `json:"category_id"`
	Amount               float64    `json:"amount"`
	Name                 string     `json:"name"`
	StartDate            time.Time  `json:"start_date"`
	EndDate              time.Time  `json:"end_date"`
	Frequency            string     `json:"frequency"`
	BudgetMode           BudgetMode `json:"budget_mode"`
	TemplateID           *uuid.UUID `json:"template_id,omitempty"`
	GlobalLimitAmount    *float64   `json:"global_limit_amount,omitempty"`
	PercentageAllocation *float64   `json:"percentage_allocation,omitempty"`
	IsFlexBucket         bool       `json:"is_flex_bucket"`
	RolloverEnabled      bool       `json:"rollover_enabled"`
	LastRolloverAmount   float64    `json:"last_rollover_amount"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}

type CreateBudgetRequest struct {
	CategoryID           uuid.UUID  `json:"category_id" validate:"required"`
	Amount               float64    `json:"amount" validate:"required,gte=0"`
	Name                 string     `json:"name"`
	StartDate            time.Time  `json:"start_date" validate:"required"`
	EndDate              time.Time  `json:"end_date" validate:"required"`
	Frequency            string     `json:"frequency" validate:"required"`
	BudgetMode           BudgetMode `json:"budget_mode" validate:"required"`
	TemplateID           *uuid.UUID `json:"template_id,omitempty"`
	GlobalLimitAmount    *float64   `json:"global_limit_amount,omitempty"`
	PercentageAllocation *float64   `json:"percentage_allocation,omitempty"`
	IsFlexBucket         bool       `json:"is_flex_bucket"`
}

type BudgetProgressItem struct {
	BudgetID            uuid.UUID  `json:"budget_id"`
	BudgetName          string     `json:"budget_name"`
	CategoryID          uuid.UUID  `json:"category_id"`
	BudgetedAmount      float64    `json:"budgeted_amount"`
	SpentAmount         float64    `json:"spent_amount"`
	RemainingAmount     float64    `json:"remaining_amount"`
	PercentageUsed      float64    `json:"percentage_used"`
	BudgetMode          BudgetMode `json:"budget_mode"`
	RolloverEnabled     bool       `json:"rollover_enabled"`
	RolloverCarryover   float64    `json:"rollover_carryover"`
}

type BudgetTemplate struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	IsDefault   bool      `json:"is_default"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type BudgetTemplateCategory struct {
	ID           uuid.UUID `json:"id"`
	TemplateID   uuid.UUID `json:"template_id"`
	CategoryName string    `json:"category_name"`
	Percentage   float64   `json:"percentage"`
	Description  string    `json:"description"`
	CreatedAt    time.Time `json:"created_at"`
}

type UserBudgetSettings struct {
	ID              uuid.UUID               `json:"id"`
	UserID          uuid.UUID               `json:"user_id"`
	SharedFinanceID *uuid.UUID              `json:"shared_finance_id,omitempty"`
	BudgetMode      BudgetMode              `json:"budget_mode"`
	Settings        map[string]interface{}  `json:"settings"`
	CreatedAt       time.Time               `json:"created_at"`
	UpdatedAt       time.Time               `json:"updated_at"`
}

type UpdateBudgetModeRequest struct {
	BudgetMode BudgetMode              `json:"budget_mode" validate:"required"`
	Settings   map[string]interface{}  `json:"settings,omitempty"`
}

type BudgetModeInfo struct {
	Mode        BudgetMode `json:"mode"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	IsEnabled   bool       `json:"is_enabled"`
}
