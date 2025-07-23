package transactions

import (
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/repository/dto"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type ListTransactionsParams struct {
	UserID     uuid.UUID
	Page       int
	Limit      int
	Search     *string
	Type       *string
	AccountID  *uuid.UUID
	CategoryID *uuid.UUID
	Currency   *string
	StartDate  *time.Time
	EndDate    *time.Time
	MinAmount  *float64
	MaxAmount  *float64
	Tags       []string
	IsExternal *bool
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

type BulkCreateTransactionsRequest struct {
	AccountID    string                     `json:"account_id" validate:"required"`
	Transactions []CreateTransactionRequest `json:"transactions" validate:"required,min=1"`
}

type TransfertParams struct {
	Amount               decimal.Decimal
	Type                 string
	AccountID            uuid.UUID
	DestinationAccountID uuid.UUID
	CategoryID           uuid.UUID
	Description          *string
	TransactionCurrency  string
	OriginalAmount       decimal.Decimal
	TransactionDatetime  time.Time
	Details              dto.Details
	UserID               uuid.UUID
}

type BulkUpdateManualTransactionsParams struct {
	Ids                 []uuid.UUID
	CategoryID          *uuid.UUID
	AccountID           *uuid.UUID
	TransactionDatetime *time.Time
	UserID              uuid.UUID
}

// location, note, medium -> details

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

type EnhancedTransaction struct {
	repository.ListTransactionsRow
	DestinationAccount *repository.GetAccountsRow `json:"destination_account,omitempty"`
}

type Group struct {
	ID           string                `json:"id"`
	Date         string                `json:"date"`  // e.g., "October 19 2029 - 2"
	Total        float64               `json:"total"` // e.g., "$700.00"
	Transactions []EnhancedTransaction `json:"transactions"`
}
