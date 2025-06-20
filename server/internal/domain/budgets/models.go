package budgets

import (
	"time"

	"github.com/google/uuid"
)

type Budget struct {
	ID                 uuid.UUID  `json:"id"`
	UserID             uuid.UUID  `json:"user_id"`
	SharedFinanceID    *uuid.UUID `json:"shared_finance_id,omitempty"` // Nullable
	CategoryID         uuid.UUID  `json:"category_id"`
	Amount             float64    `json:"amount"`
	Name               string     `json:"name"` // Added name for clarity
	StartDate          time.Time  `json:"start_date"`
	EndDate            time.Time  `json:"end_date"`
	Frequency          string     `json:"frequency"`
	RolloverEnabled    bool       `json:"rollover_enabled"`     // NEW
	LastRolloverAmount float64    `json:"last_rollover_amount"` // NEW
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

type CreateBudgetRequest struct {
	CategoryID uuid.UUID `json:"category_id" validate:"required"`
	Amount     float64   `json:"amount" validate:"required,gte=0"`
	Name       string    `json:"name"` // Added name for clarity
	StartDate  time.Time `json:"start_date" validate:"required"`
	EndDate    time.Time `json:"end_date" validate:"required"`
	Frequency  string    `json:"frequency" validate:"required"`
	// RolloverEnabled    bool      `json:"rollover_enabled"`     // NEW
	// LastRolloverAmount float64   `json:"last_rollover_amount"` // NEW
}

type BudgetProgressItem struct {
	BudgetID        uuid.UUID `json:"budget_id"`
	BudgetName      string    `json:"budget_name"` // From budget table
	CategoryID      uuid.UUID `json:"category_id"` // For linking
	BudgetedAmount  float64   `json:"budgeted_amount"`
	SpentAmount     float64   `json:"spent_amount"`
	RemainingAmount float64   `json:"remaining_amount"`
	PercentageUsed  float64   `json:"percentage_used"`
	// NEW: Rollover details for frontend display
	// RolloverEnabled   bool    `json:"rollover_enabled"`
	// RolloverCarryover float64 `json:"rollover_carryover"` // Amount carried over this period
}
