package transactions

import (
	"time"

	"github.com/Fantasy-Programming/nuts/internal/repository/dto"
)

type CreateTransactionRequest struct {
	TransactionDatetime time.Time   `json:"transaction_datetime"`
	Description         *string     `json:"description"`
	Type                string      `json:"type"`
	AccountID           string      `json:"account_id"`
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
	CategoryID           string      `json:"category_id"`
	Details              dto.Details `json:"details"`
	Amount               float64     `json:"amount"`
}

// location, note, medium -> details
