package transactions

import (
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository/dto"
	"github.com/google/uuid"
)

type ListTransactionsParams struct {
	UserID    uuid.UUID
	Page      int
	Limit     int
	Search    *string
	Type      *string
	AccountID *uuid.UUID
	StartDate *time.Time
	EndDate   *time.Time
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

// location, note, medium -> details
