package llm

import (
	"context"
	"time"

	"github.com/shopspring/decimal"
)

// TransactionData represents a parsed transaction from neural input
type TransactionData struct {
	Amount              decimal.Decimal `json:"amount"`
	Type                string          `json:"type"` // "income", "expense", "transfer"
	Description         *string         `json:"description,omitempty"`
	CategoryHint        *string         `json:"category_hint,omitempty"` // Suggested category name/type
	MerchantName        *string         `json:"merchant_name,omitempty"`
	TransactionDatetime *time.Time      `json:"transaction_datetime,omitempty"`
	CurrencyCode        string          `json:"currency_code"`
	PaymentMedium       *string         `json:"payment_medium,omitempty"` // credit_card, cash, etc.
	Location            *string         `json:"location,omitempty"`
	Note                *string         `json:"note,omitempty"`
	Confidence          float64         `json:"confidence"` // 0.0 to 1.0, how confident the AI is
}

// NeuralInputRequest represents the user's ambiguous input
type NeuralInputRequest struct {
	Input          string  `json:"input" validate:"required,min=1"`
	UserTimezone   *string `json:"user_timezone,omitempty"`   // For date parsing context
	BaseCurrency   *string `json:"base_currency,omitempty"`   // User's default currency
	AccountContext *string `json:"account_context,omitempty"` // Additional context about accounts
}

// NeuralInputResponse contains the parsed transactions
type NeuralInputResponse struct {
	Transactions []TransactionData `json:"transactions"`
	ParsedAt     time.Time         `json:"parsed_at"`
	Model        string            `json:"model"` // Which model was used
	Provider     string            `json:"provider"` // local or remote
}

// Provider defines the interface for LLM providers
type Provider interface {
	// GenerateCompletion sends a prompt to the LLM and returns the response
	GenerateCompletion(ctx context.Context, prompt string) (string, error)
	
	// GetModelInfo returns information about the current model
	GetModelInfo() ModelInfo
}

// ModelInfo contains metadata about a model
type ModelInfo struct {
	Name     string `json:"name"`
	Provider string `json:"provider"`
	Type     string `json:"type"` // local or remote
}

// Service is the main neural input service
type Service interface {
	// ParseTransactions takes ambiguous input and returns structured transaction data
	ParseTransactions(ctx context.Context, req NeuralInputRequest) (*NeuralInputResponse, error)
}