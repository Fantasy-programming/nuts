package transactions

import (
	"time"
)

type CreateAccountRequest struct {
	Meta     *[]byte `json:"meta,omitempty" validate:"omitempty"`
	Name     string  `json:"name" validate:"required"`
	Type     string  `json:"type" validate:"required"`
	Currency string  `json:"currency" validate:"required"`
	Colors   string  `json:"color" validate:"required"`
	Balance  float64 `json:"balance" validate:"required"`
}

type CreateTransactionRequest struct {
	TransactionDatetime time.Time `json:"transaction_datetime"`
	Description         *string   `json:"description"`
	Location            *string   `json:"location"`
	Type                string    `json:"type"`
	AccountID           string    `json:"account_id"`
	CategoryID          string    `json:"category_id"`
	Medium              string    `json:"medium"`
	Details             []byte    `json:"details"`
	Amount              float64   `json:"amount"`
}
