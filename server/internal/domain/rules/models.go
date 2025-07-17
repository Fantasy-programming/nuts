package rules

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// ConditionType represents the type of condition
type ConditionType string

const (
	ConditionTypeDescription ConditionType = "description"
	ConditionTypeAmount      ConditionType = "amount"
	ConditionTypeAccount     ConditionType = "account"
	ConditionTypeDirection   ConditionType = "direction"
	ConditionTypeType        ConditionType = "type"
	ConditionTypeCategory    ConditionType = "category"
)

// ConditionOperator represents the operator for the condition
type ConditionOperator string

const (
	OperatorEquals        ConditionOperator = "equals"
	OperatorNotEquals     ConditionOperator = "not_equals"
	OperatorContains      ConditionOperator = "contains"
	OperatorNotContains   ConditionOperator = "not_contains"
	OperatorStartsWith    ConditionOperator = "starts_with"
	OperatorEndsWith      ConditionOperator = "ends_with"
	OperatorGreaterThan   ConditionOperator = "greater_than"
	OperatorGreaterEqual  ConditionOperator = "greater_equal"
	OperatorLessThan      ConditionOperator = "less_than"
	OperatorLessEqual     ConditionOperator = "less_equal"
)

// ActionType represents the type of action
type ActionType string

const (
	ActionTypeSetCategory    ActionType = "set_category"
	ActionTypeSetDescription ActionType = "set_description"
	ActionTypeSetTags        ActionType = "set_tags"
	ActionTypeSetNote        ActionType = "set_note"
)

// RuleCondition represents a single condition in a rule
type RuleCondition struct {
	Type      ConditionType     `json:"type"`
	Operator  ConditionOperator `json:"operator"`
	Value     interface{}       `json:"value"`
	LogicGate string            `json:"logic_gate,omitempty"` // "AND" or "OR" - used to combine with next condition
}

// RuleAction represents a single action in a rule
type RuleAction struct {
	Type  ActionType  `json:"type"`
	Value interface{} `json:"value"`
}

// TransactionRule represents a rule for automatically categorizing transactions
type TransactionRule struct {
	ID         uuid.UUID       `json:"id"`
	Name       string          `json:"name"`
	IsActive   bool            `json:"is_active"`
	Priority   int             `json:"priority"`
	Conditions []RuleCondition `json:"conditions"`
	Actions    []RuleAction    `json:"actions"`
	CreatedBy  uuid.UUID       `json:"created_by"`
	UpdatedBy  *uuid.UUID      `json:"updated_by,omitempty"`
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at"`
	DeletedAt  *time.Time      `json:"deleted_at,omitempty"`
}

// TransactionData represents the data available for rule evaluation
type TransactionData struct {
	ID                   uuid.UUID       `json:"id"`
	Amount               decimal.Decimal `json:"amount"`
	Type                 string          `json:"type"`
	AccountID            uuid.UUID       `json:"account_id"`
	AccountName          string          `json:"account_name"`
	CategoryID           *uuid.UUID      `json:"category_id,omitempty"`
	CategoryName         string          `json:"category_name,omitempty"`
	DestinationAccountID *uuid.UUID      `json:"destination_account_id,omitempty"`
	Description          *string         `json:"description,omitempty"`
	TransactionDatetime  time.Time       `json:"transaction_datetime"`
	TransactionCurrency  string          `json:"transaction_currency"`
	IsExternal           bool            `json:"is_external"`
	Tags                 []string        `json:"tags,omitempty"`
}

// RuleMatch represents the result of applying a rule to a transaction
type RuleMatch struct {
	RuleID       uuid.UUID       `json:"rule_id"`
	RuleName     string          `json:"rule_name"`
	RulePriority int             `json:"rule_priority"`
	Actions      []RuleAction    `json:"actions"`
	Applied      bool            `json:"applied"`
	Error        string          `json:"error,omitempty"`
}

// CreateTransactionRuleRequest represents the request to create a new rule
type CreateTransactionRuleRequest struct {
	Name       string          `json:"name" validate:"required,min=1,max=255"`
	IsActive   bool            `json:"is_active"`
	Priority   int             `json:"priority"`
	Conditions []RuleCondition `json:"conditions" validate:"required,min=1"`
	Actions    []RuleAction    `json:"actions" validate:"required,min=1"`
}

// UpdateTransactionRuleRequest represents the request to update an existing rule
type UpdateTransactionRuleRequest struct {
	Name       *string          `json:"name,omitempty" validate:"omitempty,min=1,max=255"`
	IsActive   *bool            `json:"is_active,omitempty"`
	Priority   *int             `json:"priority,omitempty"`
	Conditions *[]RuleCondition `json:"conditions,omitempty" validate:"omitempty,min=1"`
	Actions    *[]RuleAction    `json:"actions,omitempty" validate:"omitempty,min=1"`
}

// Custom JSON marshaling for RuleCondition to handle interface{} values
func (rc *RuleCondition) MarshalJSON() ([]byte, error) {
	type Alias RuleCondition
	return json.Marshal(&struct {
		*Alias
	}{
		Alias: (*Alias)(rc),
	})
}

// Custom JSON unmarshaling for RuleCondition to handle interface{} values
func (rc *RuleCondition) UnmarshalJSON(data []byte) error {
	type Alias RuleCondition
	aux := &struct {
		*Alias
	}{
		Alias: (*Alias)(rc),
	}
	return json.Unmarshal(data, aux)
}

// Custom JSON marshaling for RuleAction to handle interface{} values
func (ra *RuleAction) MarshalJSON() ([]byte, error) {
	type Alias RuleAction
	return json.Marshal(&struct {
		*Alias
	}{
		Alias: (*Alias)(ra),
	})
}

// Custom JSON unmarshaling for RuleAction to handle interface{} values
func (ra *RuleAction) UnmarshalJSON(data []byte) error {
	type Alias RuleAction
	aux := &struct {
		*Alias
	}{
		Alias: (*Alias)(ra),
	}
	return json.Unmarshal(data, aux)
}