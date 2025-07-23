package transactions

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// Enhanced Details struct with more comprehensive transaction metadata
type Details struct {
	PaymentMedium        string           `json:"payment_medium"` // credit_card, debit_card, cash, check, etc.
	Location             string           `json:"location"`
	Note                 string           `json:"note"`
	PaymentStatus        string           `json:"payment_status"` // pending, completed, failed, cancelled
	CardLastFour         string           `json:"card_last_four,omitempty"`
	AuthorizationCode    string           `json:"authorization_code,omitempty"`
	MerchantCategoryCode string           `json:"merchant_category_code,omitempty"` // MCC code
	RewardsEarned        *decimal.Decimal `json:"rewards_earned,omitempty"`
	ReceiptNumber        string           `json:"receipt_number,omitempty"`
	TipAmount            *decimal.Decimal `json:"tip_amount,omitempty"`
	TaxAmount            *decimal.Decimal `json:"tax_amount,omitempty"`
	DiscountAmount       *decimal.Decimal `json:"discount_amount,omitempty"`
	InvoiceNumber        string           `json:"invoice_number,omitempty"`
	ProjectCode          string           `json:"project_code,omitempty"` // For business expense tracking
	ClientName           string           `json:"client_name,omitempty"`
	SubTransactions      []SubTransaction `json:"sub_transactions,omitempty"` // For itemized receipts
}

// SubTransaction for itemized receipts
type SubTransaction struct {
	Description string           `json:"description"`
	Amount      decimal.Decimal  `json:"amount"`
	Quantity    int              `json:"quantity,omitempty"`
	UnitPrice   *decimal.Decimal `json:"unit_price,omitempty"`
	Category    string           `json:"category,omitempty"`
}

// LocationData for GPS and address information
type LocationData struct {
	Latitude   *float64 `json:"latitude,omitempty"`
	Longitude  *float64 `json:"longitude,omitempty"`
	Address    string   `json:"address,omitempty"`
	City       string   `json:"city,omitempty"`
	State      string   `json:"state,omitempty"`
	Country    string   `json:"country,omitempty"`
	PostalCode string   `json:"postal_code,omitempty"`
	PlaceID    string   `json:"place_id,omitempty"` // Google Places ID
	Accuracy   *float64 `json:"accuracy,omitempty"` // GPS accuracy in meters
}

// Implement Valuer and Scanner for LocationData
func (ld LocationData) Value() (driver.Value, error) {
	return json.Marshal(ld)
}

func (ld *LocationData) Scan(value any) error {
	if value == nil {
		return nil
	}
	if bytes, ok := value.([]byte); ok {
		return json.Unmarshal(bytes, ld)
	}
	return nil
}

// Enhanced Transaction struct
type Transaction struct {
	ID                      uuid.UUID        `json:"id" db:"id"`
	Amount                  decimal.Decimal  `json:"amount" db:"amount"`
	Type                    string           `json:"type" db:"type"`
	AccountID               uuid.UUID        `json:"account_id" db:"account_id"`
	CategoryID              uuid.UUID        `json:"category_id" db:"category_id"`
	DestinationAccountID    *uuid.UUID       `json:"destination_account_id,omitempty" db:"destination_account_id"`
	MerchantID              *uuid.UUID       `json:"merchant_id,omitempty" db:"merchant_id"`
	Payee                   *string          `json:"payee,omitempty" db:"payee"`
	CurrencyCode            string           `json:"currency_code" db:"currency_code"`
	ExchangeRate            *decimal.Decimal `json:"exchange_rate,omitempty" db:"exchange_rate"`
	BaseCurrencyAmount      *decimal.Decimal `json:"base_currency_amount,omitempty" db:"base_currency_amount"`
	LocationData            *LocationData    `json:"location_data,omitempty" db:"location_data"`
	RecurringTransactionID  *uuid.UUID       `json:"recurring_transaction_id,omitempty" db:"recurring_transaction_id"`
	ExternalTransactionID   *string          `json:"external_transaction_id,omitempty" db:"external_transaction_id"`
	ReferenceNumber         *string          `json:"reference_number,omitempty" db:"reference_number"`
	TaxDeductible           bool             `json:"tax_deductible" db:"tax_deductible"`
	BusinessExpense         bool             `json:"business_expense" db:"business_expense"`
	SplitTransactionGroupID *uuid.UUID       `json:"split_transaction_group_id,omitempty" db:"split_transaction_group_id"`
	TransactionDatetime     time.Time        `json:"transaction_datetime" db:"transaction_datetime"`
	Description             *string          `json:"description,omitempty" db:"description"`
	Details                 *Details         `json:"details,omitempty" db:"details"`
	// IsCategorized      bool       `json:"is_categorized"`
	// PlaidTransactionID *string    `json:"plaid_transaction_id"`
	// SharedFinanceID    *uuid.UUID `json:"shared_finance_id,omitempty"`
	// IsReconciled       bool       `json:"is_reconciled"`         // NEW
	// ReconciliationNotes *string    `json:"reconciliation_notes"` // NEW
	// ReconciledAt       *time.Time `json:"reconciled_at"`       // NEW
	CreatedBy *uuid.UUID `json:"created_by,omitempty" db:"created_by"`
	UpdatedBy *uuid.UUID `json:"updated_by,omitempty" db:"updated_by"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`

	// Related data that can be loaded with joins
	Merchant    *Merchant          `json:"merchant,omitempty"`
	Tags        []Tag              `json:"tags,omitempty"`
	Attachments []Attachment       `json:"attachments,omitempty"`
	Splits      []TransactionSplit `json:"splits,omitempty"`
}

// Merchant represents a business or vendor
type Merchant struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	Name      string     `json:"name" db:"name"`
	Category  *string    `json:"category,omitempty" db:"category"`
	Website   *string    `json:"website,omitempty" db:"website"`
	Phone     *string    `json:"phone,omitempty" db:"phone"`
	Address   *Details   `json:"address,omitempty" db:"address"` // Reuse Details for address structure
	LogoURL   *string    `json:"logo_url,omitempty" db:"logo_url"`
	CreatedBy *uuid.UUID `json:"created_by,omitempty" db:"created_by"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

// Tag represents a user-defined tag for categorization
type Tag struct {
	ID        uuid.UUID `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Color     *string   `json:"color,omitempty" db:"color"`
	Icon      *string   `json:"icon,omitempty" db:"icon"`
	UserID    uuid.UUID `json:"user_id" db:"user_id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// TransactionTag represents the many-to-many relationship
type TransactionTag struct {
	TransactionID uuid.UUID `json:"transaction_id" db:"transaction_id"`
	TagID         uuid.UUID `json:"tag_id" db:"tag_id"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
}

// Attachment represents a file attached to a transaction
type Attachment struct {
	ID               uuid.UUID `json:"id" db:"id"`
	TransactionID    uuid.UUID `json:"transaction_id" db:"transaction_id"`
	Filename         string    `json:"filename" db:"filename"`
	OriginalFilename string    `json:"original_filename" db:"original_filename"`
	FileSize         int64     `json:"file_size" db:"file_size"`
	MimeType         string    `json:"mime_type" db:"mime_type"`
	StorageKey       string    `json:"storage_key" db:"storage_key"`
	BucketName       string    `json:"bucket_name" db:"bucket_name"`
	IsEncrypted      bool      `json:"is_encrypted" db:"is_encrypted"`
	EncryptionKeyID  *string   `json:"encryption_key_id,omitempty" db:"encryption_key_id"`
	UploadedBy       uuid.UUID `json:"uploaded_by" db:"uploaded_by"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`

	// Computed fields
	PresignedURL *string `json:"presigned_url,omitempty"` // Temporary download URL
}

// TransactionSplit for splitting transactions across categories
type TransactionSplit struct {
	ID                  uuid.UUID        `json:"id" db:"id"`
	ParentTransactionID uuid.UUID        `json:"parent_transaction_id" db:"parent_transaction_id"`
	CategoryID          uuid.UUID        `json:"category_id" db:"category_id"`
	Amount              decimal.Decimal  `json:"amount" db:"amount"`
	Description         *string          `json:"description,omitempty" db:"description"`
	Percentage          *decimal.Decimal `json:"percentage,omitempty" db:"percentage"`
	CreatedAt           time.Time        `json:"created_at" db:"created_at"`
}

// Currency represents a currency with exchange rate information
type Currency struct {
	Code          string    `json:"code" db:"code"`
	Name          string    `json:"name" db:"name"`
	Symbol        *string   `json:"symbol,omitempty" db:"symbol"`
	DecimalPlaces int       `json:"decimal_places" db:"decimal_places"`
	IsActive      bool      `json:"is_active" db:"is_active"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}

// ExchangeRate represents historical exchange rates
type ExchangeRate struct {
	ID           uuid.UUID       `json:"id" db:"id"`
	FromCurrency string          `json:"from_currency" db:"from_currency"`
	ToCurrency   string          `json:"to_currency" db:"to_currency"`
	Rate         decimal.Decimal `json:"rate" db:"rate"`
	RateDate     time.Time       `json:"rate_date" db:"rate_date"`
	Source       *string         `json:"source,omitempty" db:"source"`
	CreatedAt    time.Time       `json:"created_at" db:"created_at"`
}

// Enhanced request structs
// type CreateTransactionRequest struct {
// 	Amount                decimal.Decimal          `json:"amount" validate:"required,gt=0"`
// 	Type                  string                   `json:"type" validate:"required,oneof=income expense transfer"`
// 	AccountID             string                   `json:"account_id" validate:"required,uuid"`
// 	CategoryID            string                   `json:"category_id" validate:"required,uuid"`
// 	DestinationAccountID  *string                  `json:"destination_account_id,omitempty" validate:"omitempty,uuid"`
// 	MerchantID            *string                  `json:"merchant_id,omitempty" validate:"omitempty,uuid"`
// 	Payee                 *string                  `json:"payee,omitempty"`
// 	CurrencyCode          string                   `json:"currency_code" validate:"required,len=3"`
// 	ExchangeRate          *decimal.Decimal         `json:"exchange_rate,omitempty"`
// 	LocationData          *LocationData            `json:"location_data,omitempty"`
// 	ExternalTransactionID *string                  `json:"external_transaction_id,omitempty"`
// 	ReferenceNumber       *string                  `json:"reference_number,omitempty"`
// 	TaxDeductible         bool                     `json:"tax_deductible"`
// 	BusinessExpense       bool                     `json:"business_expense"`
// 	TransactionDatetime   time.Time                `json:"transaction_datetime" validate:"required"`
// 	Description           *string                  `json:"description,omitempty"`
// 	Details               *Details                 `json:"details,omitempty"`
// 	TagIDs                []string                 `json:"tag_ids,omitempty"`
// 	Splits                []CreateTransactionSplit `json:"splits,omitempty"`
// }

type RecurringTransaction struct {
	ID                uuid.UUID  `json:"id"`
	UserID            uuid.UUID  `json:"user_id"`
	AccountID         uuid.UUID  `json:"account_id"`
	Description       string     `json:"description"`
	Amount            float64    `json:"amount"`
	Type              string     `json:"type"`
	CategoryID        *uuid.UUID `json:"category_id,omitempty"` // Nullable
	Frequency         string     `json:"frequency"`
	StartDate         time.Time  `json:"start_date"`
	EndDate           *time.Time `json:"end_date,omitempty"`            // Nullable
	LastGeneratedDate *time.Time `json:"last_generated_date,omitempty"` // Nullable
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

/// RULES

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
	OperatorEquals       ConditionOperator = "equals"
	OperatorNotEquals    ConditionOperator = "not_equals"
	OperatorContains     ConditionOperator = "contains"
	OperatorNotContains  ConditionOperator = "not_contains"
	OperatorStartsWith   ConditionOperator = "starts_with"
	OperatorEndsWith     ConditionOperator = "ends_with"
	OperatorGreaterThan  ConditionOperator = "greater_than"
	OperatorGreaterEqual ConditionOperator = "greater_equal"
	OperatorLessThan     ConditionOperator = "less_than"
	OperatorLessEqual    ConditionOperator = "less_equal"
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
	RuleID       uuid.UUID    `json:"rule_id"`
	RuleName     string       `json:"rule_name"`
	RulePriority int          `json:"rule_priority"`
	Actions      []RuleAction `json:"actions"`
	Applied      bool         `json:"applied"`
	Error        string       `json:"error,omitempty"`
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

// Custom JSON marshaling for transactions.RuleAction to handle interface{} values
func (ra *RuleAction) MarshalJSON() ([]byte, error) {
	type Alias RuleAction
	return json.Marshal(&struct {
		*Alias
	}{
		Alias: (*Alias)(ra),
	})
}

// Custom JSON unmarshaling for transactions.RuleAction to handle interface{} values
func (ra *RuleAction) UnmarshalJSON(data []byte) error {
	type Alias RuleAction
	aux := &struct {
		*Alias
	}{
		Alias: (*Alias)(ra),
	}
	return json.Unmarshal(data, aux)
}
