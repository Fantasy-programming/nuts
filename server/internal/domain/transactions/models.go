package transactions

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/repository/dto"
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
	RecurringInstanceDate   *time.Time       `json:"recurring_instance_date,omitempty" db:"recurring_instance_date"`
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
	Merchant          *Merchant             `json:"merchant,omitempty"`
	Tags              []Tag                 `json:"tags,omitempty"`
	Attachments       []Attachment          `json:"attachments,omitempty"`
	Splits            []TransactionSplit    `json:"splits,omitempty"`
	RecurringTemplate *RecurringTransaction `json:"recurring_template,omitempty"`
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

type CreateTransactionSplit struct {
	CategoryID  string           `json:"category_id" validate:"required,uuid"`
	Amount      decimal.Decimal  `json:"amount" validate:"required,gt=0"`
	Description *string          `json:"description,omitempty"`
	Percentage  *decimal.Decimal `json:"percentage,omitempty"`
}

type CreateMerchantRequest struct {
	Name     string   `json:"name" validate:"required,min=1,max=255"`
	Category *string  `json:"category,omitempty"`
	Website  *string  `json:"website,omitempty" validate:"omitempty,url"`
	Phone    *string  `json:"phone,omitempty"`
	Address  *Details `json:"address,omitempty"`
	LogoURL  *string  `json:"logo_url,omitempty" validate:"omitempty,url"`
}

type CreateTagRequest struct {
	Name  string  `json:"name" validate:"required,min=1,max=100"`
	Color *string `json:"color,omitempty" validate:"omitempty,hexcolor"`
	Icon  *string `json:"icon,omitempty"`
}

type UploadAttachmentRequest struct {
	TransactionID string `json:"transaction_id" validate:"required,uuid"`
	Filename      string `json:"filename" validate:"required"`
	FileSize      int64  `json:"file_size" validate:"required,gt=0"`
	MimeType      string `json:"mime_type" validate:"required"`
}

// Response structs for API
type TransactionResponse struct {
	*Transaction
	Currency *Currency `json:"currency,omitempty"`
}

type AttachmentUploadResponse struct {
	AttachmentID uuid.UUID `json:"attachment_id"`
	UploadURL    string    `json:"upload_url"` // Presigned URL for upload
	ExpiresAt    time.Time `json:"expires_at"`
}

type AttachmentDownloadResponse struct {
	DownloadURL string    `json:"download_url"`
	ExpiresAt   time.Time `json:"expires_at"`
}

// Request structs for recurring transactions
type CreateRecurringTransactionRequest struct {
	AccountID            string          `json:"account_id" validate:"required,uuid"`
	CategoryID           *string         `json:"category_id,omitempty" validate:"omitempty,uuid"`
	DestinationAccountID *string         `json:"destination_account_id,omitempty" validate:"omitempty,uuid"`
	Amount               decimal.Decimal `json:"amount" validate:"required,gt=0"`
	Type                 string          `json:"type" validate:"required,oneof=income expense transfer"`
	Description          *string         `json:"description,omitempty"`
	Details              *dto.Details    `json:"details,omitempty"`
	Frequency            string          `json:"frequency" validate:"required,oneof=daily weekly biweekly monthly yearly custom"`
	FrequencyInterval    int             `json:"frequency_interval" validate:"min=1,max=999"`
	FrequencyData        *FrequencyData  `json:"frequency_data,omitempty"`
	StartDate            time.Time       `json:"start_date" validate:"required"`
	EndDate              *time.Time      `json:"end_date,omitempty"`
	AutoPost             bool            `json:"auto_post"`
	MaxOccurrences       *int            `json:"max_occurrences,omitempty" validate:"omitempty,min=1"`
	TemplateName         *string         `json:"template_name,omitempty"`
	Tags                 *Tags           `json:"tags,omitempty"`
}

type UpdateRecurringTransactionRequest struct {
	AccountID            *string          `json:"account_id,omitempty" validate:"omitempty,uuid"`
	CategoryID           *string          `json:"category_id,omitempty" validate:"omitempty,uuid"`
	DestinationAccountID *string          `json:"destination_account_id,omitempty" validate:"omitempty,uuid"`
	Amount               *decimal.Decimal `json:"amount,omitempty" validate:"omitempty,gt=0"`
	Type                 *string          `json:"type,omitempty" validate:"omitempty,oneof=income expense transfer"`
	Description          *string          `json:"description,omitempty"`
	Details              *dto.Details     `json:"details,omitempty"`
	Frequency            *string          `json:"frequency,omitempty" validate:"omitempty,oneof=daily weekly biweekly monthly yearly custom"`
	FrequencyInterval    *int             `json:"frequency_interval,omitempty" validate:"omitempty,min=1,max=999"`
	FrequencyData        *FrequencyData   `json:"frequency_data,omitempty"`
	StartDate            *time.Time       `json:"start_date,omitempty"`
	EndDate              *time.Time       `json:"end_date,omitempty"`
	AutoPost             *bool            `json:"auto_post,omitempty"`
	MaxOccurrences       *int             `json:"max_occurrences,omitempty" validate:"omitempty,min=1"`
	TemplateName         *string          `json:"template_name,omitempty"`
	Tags                 *Tags            `json:"tags,omitempty"`
	UpdateMode           string           `json:"update_mode" validate:"oneof=future_only next_only split_series"`
}

type RecurringTransactionFilters struct {
	AccountID    *string    `json:"account_id,omitempty" validate:"omitempty,uuid"`
	CategoryID   *string    `json:"category_id,omitempty" validate:"omitempty,uuid"`
	Frequency    *string    `json:"frequency,omitempty"`
	IsPaused     *bool      `json:"is_paused,omitempty"`
	AutoPost     *bool      `json:"auto_post,omitempty"`
	TemplateName *string    `json:"template_name,omitempty"`
	StartDate    *time.Time `json:"start_date,omitempty"`
	EndDate      *time.Time `json:"end_date,omitempty"`
}

type GetRecurringInstancesRequest struct {
	StartDate        time.Time `json:"start_date" validate:"required"`
	EndDate          time.Time `json:"end_date" validate:"required"`
	IncludeProjected bool      `json:"include_projected"`
}

type ProcessRecurringTransactionRequest struct {
	Action             string                    `json:"action" validate:"required,oneof=post skip modify"`
	TransactionRequest *CreateTransactionRequest `json:"transaction_request,omitempty"`
}

// Response structs for recurring transactions
type RecurringTransactionResponse struct {
	*RecurringTransaction
	Account            *repository.Account  `json:"account,omitempty"`
	Category           *repository.Category `json:"category,omitempty"`
	DestinationAccount *repository.Account  `json:"destination_account,omitempty"`
	UpcomingInstances  []RecurringInstance  `json:"upcoming_instances,omitempty"`
}

type RecurringInstancesResponse struct {
	Instances []RecurringInstance `json:"instances"`
	Summary   struct {
		TotalCount   int             `json:"total_count"`
		PendingCount int             `json:"pending_count"`
		PostedCount  int             `json:"posted_count"`
		SkippedCount int             `json:"skipped_count"`
		TotalAmount  decimal.Decimal `json:"total_amount"`
	} `json:"summary"`
}

// RecurringTransaction represents a template for recurring transactions
type RecurringTransaction struct {
	ID                   uuid.UUID  `json:"id" db:"id"`
	UserID               uuid.UUID  `json:"user_id" db:"user_id"`
	AccountID            uuid.UUID  `json:"account_id" db:"account_id"`
	CategoryID           *uuid.UUID `json:"category_id,omitempty" db:"category_id"`
	DestinationAccountID *uuid.UUID `json:"destination_account_id,omitempty" db:"destination_account_id"`

	// Basic transaction details
	Amount      decimal.Decimal `json:"amount" db:"amount"`
	Type        string          `json:"type" db:"type"`
	Description *string         `json:"description,omitempty" db:"description"`
	Details     *Details        `json:"details,omitempty" db:"details"`

	// Recurrence pattern
	Frequency         string         `json:"frequency" db:"frequency"`
	FrequencyInterval int            `json:"frequency_interval" db:"frequency_interval"`
	FrequencyData     *FrequencyData `json:"frequency_data,omitempty" db:"frequency_data"`

	// Date management
	StartDate         time.Time  `json:"start_date" db:"start_date"`
	EndDate           *time.Time `json:"end_date,omitempty" db:"end_date"`
	LastGeneratedDate *time.Time `json:"last_generated_date,omitempty" db:"last_generated_date"`
	NextDueDate       time.Time  `json:"next_due_date" db:"next_due_date"`

	// Configuration
	AutoPost         bool `json:"auto_post" db:"auto_post"`
	IsPaused         bool `json:"is_paused" db:"is_paused"`
	MaxOccurrences   *int `json:"max_occurrences,omitempty" db:"max_occurrences"`
	OccurrencesCount int  `json:"occurrences_count" db:"occurrences_count"`

	// Template metadata
	TemplateName *string `json:"template_name,omitempty" db:"template_name"`
	Tags         *Tags   `json:"tags,omitempty" db:"tags"`

	// Audit fields
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`

	// Computed fields for responses
	NextInstances []RecurringInstance `json:"next_instances,omitempty"`
	Status        string              `json:"status,omitempty"` // "active", "paused", "completed", "expired"
}

// FrequencyData holds complex recurrence pattern data
type FrequencyData struct {
	DayOfWeek     *int    `json:"day_of_week,omitempty"`    // 0=Sunday, 1=Monday, etc.
	DayOfMonth    *int    `json:"day_of_month,omitempty"`   // 1-31
	WeekOfMonth   *int    `json:"week_of_month,omitempty"`  // 1=first, 2=second, -1=last
	MonthOfYear   *int    `json:"month_of_year,omitempty"`  // 1-12
	WeekDays      []int   `json:"week_days,omitempty"`      // For patterns like "weekdays only"
	SpecificDates []int   `json:"specific_dates,omitempty"` // For patterns like "1st and 15th"
	Pattern       *string `json:"pattern,omitempty"`        // Natural language pattern
}

// Tags for categorizing recurring transactions
type Tags []string

// RecurringInstance represents a projected or actual instance of a recurring transaction
type RecurringInstance struct {
	DueDate       time.Time       `json:"due_date"`
	Amount        decimal.Decimal `json:"amount"`
	Description   *string         `json:"description,omitempty"`
	TransactionID *uuid.UUID      `json:"transaction_id,omitempty"` // If already posted
	Status        string          `json:"status"`                   // "pending", "posted", "skipped", "failed"
	IsProjected   bool            `json:"is_projected"`             // True if not yet saved to DB
	CanModify     bool            `json:"can_modify"`               // Whether this instance can be modified
}

// RecurringTransactionStats holds statistics about recurring transactions
type RecurringTransactionStats struct {
	TotalCount  int `json:"total_count"`
	ActiveCount int `json:"active_count"`
	PausedCount int `json:"paused_count"`
	DueCount    int `json:"due_count"`
}

// Implement database interfaces for custom types
func (fd FrequencyData) Value() (driver.Value, error) {
	return json.Marshal(fd)
}

func (fd *FrequencyData) Scan(value any) error {
	if value == nil {
		return nil
	}
	if bytes, ok := value.([]byte); ok {
		return json.Unmarshal(bytes, fd)
	}
	return nil
}

func (t Tags) Value() (driver.Value, error) {
	return json.Marshal(t)
}

func (t *Tags) Scan(value any) error {
	if value == nil {
		return nil
	}
	if bytes, ok := value.([]byte); ok {
		return json.Unmarshal(bytes, t)
	}
	return nil
}
