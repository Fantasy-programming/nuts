package rules

import (
	"fmt"
	"strings"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/transactions"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// RuleEvaluator handles the evaluation of transaction rules
type RuleEvaluator struct{}

// NewRuleEvaluator creates a new rule evaluator
func NewRuleEvaluator() *RuleEvaluator {
	return &RuleEvaluator{}
}

// EvaluateRule evaluates a single rule against transaction data
func (re *RuleEvaluator) EvaluateRule(rule *transactions.TransactionRule, transaction *transactions.TransactionData) (*transactions.RuleMatch, error) {
	if !rule.IsActive {
		return &transactions.RuleMatch{
			RuleID:       rule.ID,
			RuleName:     rule.Name,
			RulePriority: rule.Priority,
			Actions:      rule.Actions,
			Applied:      false,
			Error:        "Rule is not active",
		}, nil
	}

	// Evaluate all conditions
	conditionResults := make([]bool, len(rule.Conditions))
	for i, condition := range rule.Conditions {
		result, err := re.evaluateCondition(condition, transaction)
		if err != nil {
			return &transactions.RuleMatch{
				RuleID:       rule.ID,
				RuleName:     rule.Name,
				RulePriority: rule.Priority,
				Actions:      rule.Actions,
				Applied:      false,
				Error:        fmt.Sprintf("Error evaluating condition %d: %v", i, err),
			}, nil
		}
		conditionResults[i] = result
	}

	// Combine conditions with logic gates
	finalResult := re.combineConditionResults(conditionResults, rule.Conditions)

	return &transactions.RuleMatch{
		RuleID:       rule.ID,
		RuleName:     rule.Name,
		RulePriority: rule.Priority,
		Actions:      rule.Actions,
		Applied:      finalResult,
	}, nil
}

// evaluateCondition evaluates a single condition against transaction data
func (re *RuleEvaluator) evaluateCondition(condition transactions.RuleCondition, transaction *transactions.TransactionData) (bool, error) {
	switch condition.Type {
	case transactions.ConditionTypeDescription:
		return re.evaluateStringCondition(condition, transaction.Description)
	case transactions.ConditionTypeAmount:
		return re.evaluateAmountCondition(condition, transaction.Amount)
	case transactions.ConditionTypeAccount:
		return re.evaluateAccountCondition(condition, transaction.AccountID, transaction.AccountName)
	case transactions.ConditionTypeDirection:
		return re.evaluateDirectionCondition(condition, transaction.Type, transaction.IsExternal)
	case transactions.ConditionTypeType:
		return re.evaluateTypeCondition(condition, transaction.Type)
	case transactions.ConditionTypeCategory:
		return re.evaluateCategoryCondition(condition, transaction.CategoryID, transaction.CategoryName)
	default:
		return false, fmt.Errorf("unsupported condition type: %s", condition.Type)
	}
}

// evaluateStringCondition evaluates string-based conditions
func (re *RuleEvaluator) evaluateStringCondition(condition transactions.RuleCondition, value *string) (bool, error) {
	if value == nil {
		return false, nil
	}

	conditionValue, ok := condition.Value.(string)
	if !ok {
		return false, fmt.Errorf("condition value must be a string")
	}

	valueStr := strings.ToLower(*value)
	conditionStr := strings.ToLower(conditionValue)

	switch condition.Operator {
	case transactions.OperatorEquals:
		return valueStr == conditionStr, nil
	case transactions.OperatorNotEquals:
		return valueStr != conditionStr, nil
	case transactions.OperatorContains:
		return strings.Contains(valueStr, conditionStr), nil
	case transactions.OperatorNotContains:
		return !strings.Contains(valueStr, conditionStr), nil
	case transactions.OperatorStartsWith:
		return strings.HasPrefix(valueStr, conditionStr), nil
	case transactions.OperatorEndsWith:
		return strings.HasSuffix(valueStr, conditionStr), nil
	default:
		return false, fmt.Errorf("unsupported operator for string condition: %s", condition.Operator)
	}
}

// evaluateAmountCondition evaluates amount-based conditions
func (re *RuleEvaluator) evaluateAmountCondition(condition transactions.RuleCondition, amount decimal.Decimal) (bool, error) {
	var conditionAmount decimal.Decimal
	var err error

	switch v := condition.Value.(type) {
	case string:
		conditionAmount, err = decimal.NewFromString(v)
		if err != nil {
			return false, fmt.Errorf("invalid amount value: %v", err)
		}
	case float64:
		conditionAmount = decimal.NewFromFloat(v)
	case int:
		conditionAmount = decimal.NewFromInt(int64(v))
	case int64:
		conditionAmount = decimal.NewFromInt(v)
	default:
		return false, fmt.Errorf("unsupported amount value type: %T", v)
	}

	switch condition.Operator {
	case transactions.OperatorEquals:
		return amount.Equal(conditionAmount), nil
	case transactions.OperatorNotEquals:
		return !amount.Equal(conditionAmount), nil
	case transactions.OperatorGreaterThan:
		return amount.GreaterThan(conditionAmount), nil
	case transactions.OperatorGreaterEqual:
		return amount.GreaterThanOrEqual(conditionAmount), nil
	case transactions.OperatorLessThan:
		return amount.LessThan(conditionAmount), nil
	case transactions.OperatorLessEqual:
		return amount.LessThanOrEqual(conditionAmount), nil
	default:
		return false, fmt.Errorf("unsupported operator for amount condition: %s", condition.Operator)
	}
}

// evaluateAccountCondition evaluates account-based conditions
func (re *RuleEvaluator) evaluateAccountCondition(condition transactions.RuleCondition, accountID uuid.UUID, accountName string) (bool, error) {
	switch v := condition.Value.(type) {
	case string:
		if id, err := uuid.Parse(v); err == nil {
			switch condition.Operator {
			case transactions.OperatorEquals:
				return accountID == id, nil
			case transactions.OperatorNotEquals:
				return accountID != id, nil
			default:
				return false, fmt.Errorf("unsupported operator for account ID condition: %s", condition.Operator)
			}
		} else {
			return re.evaluateStringCondition(condition, &accountName)
		}
	default:
		return false, fmt.Errorf("unsupported account value type: %T", v)
	}
}

// evaluateDirectionCondition evaluates transaction direction conditions
func (re *RuleEvaluator) evaluateDirectionCondition(condition transactions.RuleCondition, transactionType string, isExternal bool) (bool, error) {
	conditionValue, ok := condition.Value.(string)
	if !ok {
		return false, fmt.Errorf("condition value must be a string")
	}

	var direction string
	switch transactionType {
	case "income":
		direction = "incoming"
	case "expense":
		direction = "outgoing"
	case "transfer":
		if isExternal {
			direction = "outgoing"
		} else {
			direction = "internal"
		}
	default:
		direction = "unknown"
	}

	switch condition.Operator {
	case transactions.OperatorEquals:
		return direction == conditionValue, nil
	case transactions.OperatorNotEquals:
		return direction != conditionValue, nil
	default:
		return false, fmt.Errorf("unsupported operator for direction condition: %s", condition.Operator)
	}
}

// evaluateTypeCondition evaluates transaction type conditions
func (re *RuleEvaluator) evaluateTypeCondition(condition transactions.RuleCondition, transactionType string) (bool, error) {
	conditionValue, ok := condition.Value.(string)
	if !ok {
		return false, fmt.Errorf("condition value must be a string")
	}

	switch condition.Operator {
	case transactions.OperatorEquals:
		return transactionType == conditionValue, nil
	case transactions.OperatorNotEquals:
		return transactionType != conditionValue, nil
	default:
		return false, fmt.Errorf("unsupported operator for type condition: %s", condition.Operator)
	}
}

// evaluateCategoryCondition evaluates category-based conditions
func (re *RuleEvaluator) evaluateCategoryCondition(condition transactions.RuleCondition, categoryID *uuid.UUID, categoryName string) (bool, error) {
	switch v := condition.Value.(type) {
	case string:
		// Check if it's a UUID string
		if id, err := uuid.Parse(v); err == nil {
			// Compare by ID
			switch condition.Operator {
			case transactions.OperatorEquals:
				return categoryID != nil && *categoryID == id, nil
			case transactions.OperatorNotEquals:
				return categoryID == nil || *categoryID != id, nil
			default:
				return false, fmt.Errorf("unsupported operator for category ID condition: %s", condition.Operator)
			}
		} else {
			// Compare by name
			return re.evaluateStringCondition(condition, &categoryName)
		}
	default:
		return false, fmt.Errorf("unsupported category value type: %T", v)
	}
}

// combineConditionResults combines multiple condition results using logic gates
func (re *RuleEvaluator) combineConditionResults(results []bool, conditions []transactions.RuleCondition) bool {
	if len(results) == 0 {
		return false
	}

	if len(results) == 1 {
		return results[0]
	}

	// Start with the first condition result
	finalResult := results[0]

	// Apply logic gates between conditions
	for i := 1; i < len(results); i++ {
		logicGate := strings.ToUpper(conditions[i-1].LogicGate)
		if logicGate == "" {
			logicGate = "AND" // Default to AND
		}

		switch logicGate {
		case "AND":
			finalResult = finalResult && results[i]
		case "OR":
			finalResult = finalResult || results[i]
		default:
			// Invalid logic gate, default to AND
			finalResult = finalResult && results[i]
		}
	}

	return finalResult
}

// EvaluateRules evaluates multiple rules against transaction data, returns matches in priority order
func (re *RuleEvaluator) EvaluateRules(rules []transactions.TransactionRule, transaction *transactions.TransactionData) ([]transactions.RuleMatch, error) {
	var matches []transactions.RuleMatch

	for _, rule := range rules {
		match, err := re.EvaluateRule(&rule, transaction)
		if err != nil {
			return nil, fmt.Errorf("error evaluating rule %s: %v", rule.Name, err)
		}

		if match.Applied {
			matches = append(matches, *match)
		}
	}

	return matches, nil
}

