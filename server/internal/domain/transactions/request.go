package transactions

import (
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository/dto"
	"github.com/google/uuid"
)

type ListTransactionsParams struct {
	UserID        uuid.UUID
	Page          int
	Limit         int
	Search        *string
	Type          *string
	AccountID     *uuid.UUID
	CategoryID    *uuid.UUID
	Currency      *string
	StartDate     *time.Time
	EndDate       *time.Time
	MinAmount     *float64
	MaxAmount     *float64
	Tags          []string
	IsExternal    *bool
	IsRecurring   *bool
	IsPending     *bool
}

// Pagination represents the metadata for a paginated response.
type Pagination struct {
	TotalItems int `json:"total_items"`
	TotalPages int `json:"total_pages"`
	Page       int `json:"page"`
	Limit      int `json:"limit"`
}

// PaginatedTransactionsResponse is a generic wrapper for paginated data.
// The Data field can hold either a flat list of transactions or a grouped list.
type PaginatedTransactionsResponse struct {
	Data       any        `json:"data"`
	Pagination Pagination `json:"pagination"`
}

type CreateTransactionRequest struct {
	TransactionDatetime time.Time   `json:"transaction_datetime"`
	Description         *string     `json:"description"`
	Type                string      `json:"type"`
	AccountID           string      `json:"account_id"`
	TransactionCurrency *string     `json:"transaction_currency"`
	CategoryID          string      `json:"category_id"`
	Details             dto.Details `json:"details"`
	Amount              float64     `json:"amount"`
	
	// Optional recurring fields
	IsRecurring       *bool           `json:"is_recurring,omitempty"`
	RecurringConfig   *RecurringConfig `json:"recurring_config,omitempty"`
}

// RecurringConfig holds the recurring transaction configuration
type RecurringConfig struct {
	Frequency         string         `json:"frequency" validate:"required,oneof=daily weekly biweekly monthly yearly custom"`
	FrequencyInterval int            `json:"frequency_interval" validate:"min=1,max=999"`
	FrequencyData     *FrequencyData `json:"frequency_data,omitempty"`
	StartDate         time.Time      `json:"start_date" validate:"required"`
	EndDate           *time.Time     `json:"end_date,omitempty"`
	AutoPost          bool           `json:"auto_post"`
	MaxOccurrences    *int           `json:"max_occurrences,omitempty" validate:"omitempty,min=1"`
	TemplateName      *string        `json:"template_name,omitempty"`
	Tags              *Tags          `json:"tags,omitempty"`
}

type CreateTransfertRequest struct {
	TransactionDatetime  time.Time   `json:"transaction_datetime"`
	Description          *string     `json:"description"`
	Type                 string      `json:"type"`
	AccountID            string      `json:"account_id"`
	DestinationAccountID string      `json:"destination_account_id"`
	TransactionCurrency  *string     `json:"transaction_currency"`
	CategoryID           string      `json:"category_id"`
	Details              dto.Details `json:"details"`
	Amount               float64     `json:"amount"`
}

type UpdateTransactionRequest struct {
	Amount              *float64     `json:"amount,omitempty"`
	Type                *string      `json:"type,omitempty"`
	AccountID           *string      `json:"account_id,omitempty"`
	CategoryID          *string      `json:"category_id,omitempty"`
	Description         *string      `json:"description,omitempty"`
	TransactionDatetime *time.Time   `json:"transaction_datetime"`
	Details             *dto.Details `json:"details"`
	TransactionCurrency *string      `json:"transaction_currency"`
	OriginalAmount      *float64     `json:"original_amount"`
	
	// Optional recurring fields for converting to/from recurring
	IsRecurring       *bool           `json:"is_recurring,omitempty"`
	RecurringConfig   *RecurringConfig `json:"recurring_config,omitempty"`
}

// Bulk operation request types
type BulkDeleteTransactionsRequest struct {
	TransactionIDs []string `json:"transaction_ids" validate:"required,min=1"`
}

type BulkUpdateCategoriesRequest struct {
	TransactionIDs []string `json:"transaction_ids" validate:"required,min=1"`
	CategoryID     string   `json:"category_id" validate:"required"`
}

type BulkUpdateManualTransactionsRequest struct {
	TransactionIDs      []string   `json:"transaction_ids" validate:"required,min=1"`
	CategoryID          *string    `json:"category_id,omitempty"`
	AccountID           *string    `json:"account_id,omitempty"`
	TransactionDatetime *time.Time `json:"transaction_datetime,omitempty"`
}

// location, note, medium -> details
