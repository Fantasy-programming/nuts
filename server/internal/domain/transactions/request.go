package transactions

import (
	"time"
)

type CreateAccountRequest struct {
	Name     string  `json:"name" validate:"required"`
	Type     string  `json:"type" validate:"required"`
	Balance  float64 `json:"balance" validate:"required"`
	Currency string  `json:"currency" validate:"required"`
	Colors   string  `json:"color" validate:"required"`
	Meta     *[]byte `json:"meta,omitempty" validate:"omitempty"`
}

type CreateTransactionRequest struct {
	Amount              float64   `json:"amount"`
	Type                string    `json:"type"`
	AccountID           string    `json:"account_id"`
	CategoryID          string    `json:"category_id"`
	Description         *string   `json:"description"`
	TransactionDatetime time.Time `json:"transaction_datetime"`
	Medium              string    `json:"medium"`
	Location            *string   `json:"location"`
	Details             []byte    `json:"details"`
}
