package rules_test

import (
	"testing"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/transactions"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/transactions/rules"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

func TestRuleEvaluator_EvaluateRule(t *testing.T) {
	evaluator := rules.NewRuleEvaluator()

	// Test description contains condition
	description := "Amazon payment"
	transactionData := &transactions.TransactionData{
		ID:          uuid.New(),
		Amount:      decimal.NewFromFloat(25.99),
		Type:        "expense",
		AccountID:   uuid.New(),
		AccountName: "Checking",
		Description: &description,
	}

	rule := &transactions.TransactionRule{
		ID:       uuid.New(),
		Name:     "Amazon Rule",
		IsActive: true,
		Priority: 1,
		Conditions: []transactions.RuleCondition{
			{
				Type:     transactions.ConditionTypeDescription,
				Operator: transactions.OperatorContains,
				Value:    "amazon",
			},
		},
		Actions: []transactions.RuleAction{
			{
				Type:  transactions.ActionTypeSetCategory,
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

	transactionData := &transactions.TransactionData{
		ID:          uuid.New(),
		Amount:      decimal.NewFromFloat(100.00),
		Type:        "expense",
		AccountID:   uuid.New(),
		AccountName: "Checking",
	}

	rule := &transactions.TransactionRule{
		ID:       uuid.New(),
		Name:     "Large Amount Rule",
		IsActive: true,
		Priority: 1,
		Conditions: []transactions.RuleCondition{
			{
				Type:     transactions.ConditionTypeAmount,
				Operator: transactions.OperatorGreaterThan,
				Value:    50.0,
			},
		},
		Actions: []transactions.RuleAction{
			{
				Type:  transactions.ActionTypeSetCategory,
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
	evaluator := rules.NewRuleEvaluator()

	description := "Grocery Store"
	transactionData := &transactions.TransactionData{
		ID:          uuid.New(),
		Amount:      decimal.NewFromFloat(75.00),
		Type:        "expense",
		AccountID:   uuid.New(),
		AccountName: "Checking",
		Description: &description,
	}

	rule := &transactions.TransactionRule{
		ID:       uuid.New(),
		Name:     "Grocery Rule",
		IsActive: true,
		Priority: 1,
		Conditions: []transactions.RuleCondition{
			{
				Type:      transactions.ConditionTypeDescription,
				Operator:  transactions.OperatorContains,
				Value:     "grocery",
				LogicGate: "AND",
			},
			{
				Type:     transactions.ConditionTypeAmount,
				Operator: transactions.OperatorGreaterThan,
				Value:    30.0,
			},
		},
		Actions: []transactions.RuleAction{
			{
				Type:  transactions.ActionTypeSetCategory,
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
	evaluator := rules.NewRuleEvaluator()

	description := "Test transaction"
	transactionData := &transactions.TransactionData{
		ID:          uuid.New(),
		Amount:      decimal.NewFromFloat(25.99),
		Type:        "expense",
		AccountID:   uuid.New(),
		AccountName: "Checking",
		Description: &description,
	}

	rule := &transactions.TransactionRule{
		ID:       uuid.New(),
		Name:     "Inactive Rule",
		IsActive: false, // Inactive rule
		Priority: 1,
		Conditions: []transactions.RuleCondition{
			{
				Type:     transactions.ConditionTypeDescription,
				Operator: transactions.OperatorContains,
				Value:    "test",
			},
		},
		Actions: []transactions.RuleAction{
			{
				Type:  transactions.ActionTypeSetCategory,
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
