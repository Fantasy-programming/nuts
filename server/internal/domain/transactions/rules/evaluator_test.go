package rules_test

import (
	"testing"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/rules"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

func TestRuleEvaluator_EvaluateRule(t *testing.T) {
	evaluator := rules.NewRuleEvaluator()

	// Test description contains condition
	description := "Amazon payment"
	transactionData := &rules.TransactionData{
		ID:          uuid.New(),
		Amount:      decimal.NewFromFloat(25.99),
		Type:        "expense",
		AccountID:   uuid.New(),
		AccountName: "Checking",
		Description: &description,
	}

	rule := &rules.TransactionRule{
		ID:       uuid.New(),
		Name:     "Amazon Rule",
		IsActive: true,
		Priority: 1,
		Conditions: []rules.RuleCondition{
			{
				Type:     rules.ConditionTypeDescription,
				Operator: rules.OperatorContains,
				Value:    "amazon",
			},
		},
		Actions: []rules.RuleAction{
			{
				Type:  rules.ActionTypeSetCategory,
				Value: "shopping",
			},
		},
	}

	match, err := evaluator.EvaluateRule(rule, transactionData)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if !match.Applied {
		t.Errorf("Expected rule to be applied, but it wasn't")
	}

	if match.RuleID != rule.ID {
		t.Errorf("Expected rule ID %v, got %v", rule.ID, match.RuleID)
	}
}

func TestRuleEvaluator_EvaluateAmountCondition(t *testing.T) {
	evaluator := rules.NewRuleEvaluator()

	transactionData := &rules.TransactionData{
		ID:          uuid.New(),
		Amount:      decimal.NewFromFloat(100.00),
		Type:        "expense",
		AccountID:   uuid.New(),
		AccountName: "Checking",
	}

	rule := &rules.TransactionRule{
		ID:       uuid.New(),
		Name:     "Large Amount Rule",
		IsActive: true,
		Priority: 1,
		Conditions: []rules.RuleCondition{
			{
				Type:     rules.ConditionTypeAmount,
				Operator: rules.OperatorGreaterThan,
				Value:    50.0,
			},
		},
		Actions: []RuleAction{
			{
				Type:  ActionTypeSetCategory,
				Value: "large-expense",
			},
		},
	}

	match, err := evaluator.EvaluateRule(rule, transactionData)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if !match.Applied {
		t.Errorf("Expected rule to be applied, but it wasn't")
	}
}

func TestRuleEvaluator_EvaluateMultipleConditions(t *testing.T) {
	evaluator := NewRuleEvaluator()

	description := "Grocery Store"
	transactionData := &TransactionData{
		ID:          uuid.New(),
		Amount:      decimal.NewFromFloat(75.00),
		Type:        "expense",
		AccountID:   uuid.New(),
		AccountName: "Checking",
		Description: &description,
	}

	rule := &TransactionRule{
		ID:       uuid.New(),
		Name:     "Grocery Rule",
		IsActive: true,
		Priority: 1,
		Conditions: []RuleCondition{
			{
				Type:      ConditionTypeDescription,
				Operator:  OperatorContains,
				Value:     "grocery",
				LogicGate: "AND",
			},
			{
				Type:     ConditionTypeAmount,
				Operator: OperatorGreaterThan,
				Value:    30.0,
			},
		},
		Actions: []RuleAction{
			{
				Type:  ActionTypeSetCategory,
				Value: "groceries",
			},
		},
	}

	match, err := evaluator.EvaluateRule(rule, transactionData)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if !match.Applied {
		t.Errorf("Expected rule to be applied, but it wasn't")
	}
}

func TestRuleEvaluator_InactiveRule(t *testing.T) {
	evaluator := NewRuleEvaluator()

	description := "Test transaction"
	transactionData := &TransactionData{
		ID:          uuid.New(),
		Amount:      decimal.NewFromFloat(25.99),
		Type:        "expense",
		AccountID:   uuid.New(),
		AccountName: "Checking",
		Description: &description,
	}

	rule := &TransactionRule{
		ID:       uuid.New(),
		Name:     "Inactive Rule",
		IsActive: false, // Inactive rule
		Priority: 1,
		Conditions: []RuleCondition{
			{
				Type:     ConditionTypeDescription,
				Operator: OperatorContains,
				Value:    "test",
			},
		},
		Actions: []RuleAction{
			{
				Type:  ActionTypeSetCategory,
				Value: "test",
			},
		},
	}

	match, err := evaluator.EvaluateRule(rule, transactionData)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if match.Applied {
		t.Errorf("Expected rule not to be applied because it's inactive")
	}

	if match.Error != "Rule is not active" {
		t.Errorf("Expected error message 'Rule is not active', got %v", match.Error)
	}
}
