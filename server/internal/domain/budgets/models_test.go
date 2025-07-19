package budgets

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestBudgetModeConstants(t *testing.T) {
	tests := []struct {
		mode     BudgetMode
		expected string
	}{
		{BudgetModeTraditionalCategory, "traditional_category"},
		{BudgetModeFlexBucket, "flex_bucket"},
		{BudgetModeGlobalLimit, "global_limit"},
		{BudgetModeZeroBased, "zero_based"},
		{BudgetModePercentageBased, "percentage_based"},
		{BudgetModeTrackingOnly, "tracking_only"},
	}

	for _, tt := range tests {
		t.Run(string(tt.mode), func(t *testing.T) {
			assert.Equal(t, tt.expected, string(tt.mode))
		})
	}
}

func TestCreateBudgetRequest(t *testing.T) {
	categoryID := uuid.New()
	templateID := uuid.New()
	globalLimit := 1000.0
	percentage := 50.0

	req := CreateBudgetRequest{
		CategoryID:           categoryID,
		Amount:               500.0,
		Name:                 "Test Budget",
		StartDate:            time.Now(),
		EndDate:              time.Now().AddDate(0, 1, 0),
		Frequency:            "monthly",
		BudgetMode:           BudgetModePercentageBased,
		TemplateID:           &templateID,
		GlobalLimitAmount:    &globalLimit,
		PercentageAllocation: &percentage,
		IsFlexBucket:         false,
	}

	assert.Equal(t, categoryID, req.CategoryID)
	assert.Equal(t, 500.0, req.Amount)
	assert.Equal(t, "Test Budget", req.Name)
	assert.Equal(t, BudgetModePercentageBased, req.BudgetMode)
	assert.NotNil(t, req.TemplateID)
	assert.Equal(t, templateID, *req.TemplateID)
	assert.NotNil(t, req.GlobalLimitAmount)
	assert.Equal(t, globalLimit, *req.GlobalLimitAmount)
	assert.NotNil(t, req.PercentageAllocation)
	assert.Equal(t, percentage, *req.PercentageAllocation)
	assert.False(t, req.IsFlexBucket)
}

func TestBudgetModeInfo(t *testing.T) {
	info := BudgetModeInfo{
		Mode:        BudgetModeTraditionalCategory,
		Name:        "Traditional Category Budgets",
		Description: "Fixed categories with allocated amounts",
		IsEnabled:   true,
	}

	assert.Equal(t, BudgetModeTraditionalCategory, info.Mode)
	assert.Equal(t, "Traditional Category Budgets", info.Name)
	assert.True(t, info.IsEnabled)
}

func TestUpdateBudgetModeRequest(t *testing.T) {
	settings := map[string]interface{}{
		"alertThreshold": 90,
		"autoRollover":   true,
	}

	req := UpdateBudgetModeRequest{
		BudgetMode: BudgetModeFlexBucket,
		Settings:   settings,
	}

	assert.Equal(t, BudgetModeFlexBucket, req.BudgetMode)
	assert.Equal(t, settings, req.Settings)
	assert.Equal(t, 90, req.Settings["alertThreshold"])
	assert.Equal(t, true, req.Settings["autoRollover"])
}