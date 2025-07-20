package llm

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/rs/zerolog"
	"github.com/shopspring/decimal"
)

// NeuralInputService implements the Service interface
type NeuralInputService struct {
	provider Provider
	config   Config
	logger   *zerolog.Logger
}

// NewNeuralInputService creates a new neural input service
func NewNeuralInputService(config Config, logger *zerolog.Logger) (*NeuralInputService, error) {
	var provider Provider
	
	switch strings.ToLower(config.Provider) {
	case "local":
		provider = NewLocalProvider(config, logger)
	case "remote":
		provider = NewRemoteProvider(config, logger)
	default:
		return nil, fmt.Errorf("unsupported provider type: %s", config.Provider)
	}

	return &NeuralInputService{
		provider: provider,
		config:   config,
		logger:   logger,
	}, nil
}

// ParseTransactions converts ambiguous text input into structured transaction data
func (s *NeuralInputService) ParseTransactions(ctx context.Context, req NeuralInputRequest) (*NeuralInputResponse, error) {
	prompt := s.buildTransactionPrompt(req)
	
	s.logger.Debug().
		Str("input", req.Input).
		Str("provider", s.config.Provider).
		Msg("Parsing transactions with neural input")

	response, err := s.provider.GenerateCompletion(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("failed to generate completion: %w", err)
	}

	transactions, err := s.parseTransactionResponse(response)
	if err != nil {
		s.logger.Error().
			Err(err).
			Str("response", response).
			Msg("Failed to parse LLM response")
		return nil, fmt.Errorf("failed to parse LLM response: %w", err)
	}

	modelInfo := s.provider.GetModelInfo()
	
	return &NeuralInputResponse{
		Transactions: transactions,
		ParsedAt:     time.Now(),
		Model:        modelInfo.Name,
		Provider:     modelInfo.Type,
	}, nil
}

// buildTransactionPrompt creates a comprehensive prompt for transaction extraction
func (s *NeuralInputService) buildTransactionPrompt(req NeuralInputRequest) string {
	baseCurrency := "USD"
	if req.BaseCurrency != nil {
		baseCurrency = *req.BaseCurrency
	}

	userTimezone := "UTC"
	if req.UserTimezone != nil {
		userTimezone = *req.UserTimezone
	}

	prompt := fmt.Sprintf(`You are a financial transaction parser. Parse the following user input into structured transaction data.

CONTEXT:
- User's base currency: %s
- User's timezone: %s
- Current date/time: %s
%s

INPUT TO PARSE:
"%s"

INSTRUCTIONS:
1. Extract all financial transactions from the input
2. For each transaction, determine:
   - Amount (positive number, no currency symbols)
   - Type: "income", "expense", or "transfer"
   - Description (brief, clear description)
   - Category hint (general category like "food", "transport", "salary", etc.)
   - Merchant name (if identifiable)
   - Transaction date/time (ISO format, or null if not specified)
   - Currency code (3-letter ISO code, default to %s)
   - Payment medium (credit_card, debit_card, cash, bank_transfer, etc.)
   - Location (if mentioned)
   - Any additional notes
   - Confidence score (0.0 to 1.0 based on how certain you are)

3. Handle ambiguity intelligently:
   - If no amount currency is specified, assume %s
   - If no date is specified, use null
   - If transaction type is unclear, use "expense" as default
   - Provide confidence scores based on clarity of input

4. Parse multiple transactions if mentioned
5. Be conservative with amounts - don't guess wildly

RESPONSE FORMAT:
Return ONLY a valid JSON array with this exact structure:
[
  {
    "amount": "50.00",
    "type": "expense",
    "description": "Lunch at cafe",
    "category_hint": "food",
    "merchant_name": "Joe's Cafe",
    "transaction_datetime": "2024-01-15T12:30:00Z",
    "currency_code": "USD",
    "payment_medium": "credit_card",
    "location": "Downtown",
    "note": "Business lunch",
    "confidence": 0.95
  }
]

Important: Respond with ONLY the JSON array, no other text or formatting.`, 
		baseCurrency, 
		userTimezone, 
		time.Now().Format(time.RFC3339),
		s.formatAccountContext(req.AccountContext),
		req.Input,
		baseCurrency,
		baseCurrency)

	return prompt
}

// formatAccountContext adds account context to the prompt if provided
func (s *NeuralInputService) formatAccountContext(accountContext *string) string {
	if accountContext == nil || *accountContext == "" {
		return ""
	}
	return fmt.Sprintf("- Account context: %s", *accountContext)
}

// parseTransactionResponse parses the LLM response into TransactionData structs
func (s *NeuralInputService) parseTransactionResponse(response string) ([]TransactionData, error) {
	// Clean the response - remove any markdown or extra formatting
	response = strings.TrimSpace(response)
	
	// Remove markdown code blocks if present
	if strings.HasPrefix(response, "```json") {
		response = strings.TrimPrefix(response, "```json")
		response = strings.TrimSuffix(response, "```")
		response = strings.TrimSpace(response)
	} else if strings.HasPrefix(response, "```") {
		response = strings.TrimPrefix(response, "```")
		response = strings.TrimSuffix(response, "```")
		response = strings.TrimSpace(response)
	}

	// Parse raw JSON response
	var rawTransactions []map[string]interface{}
	if err := json.Unmarshal([]byte(response), &rawTransactions); err != nil {
		return nil, fmt.Errorf("failed to unmarshal JSON response: %w", err)
	}

	transactions := make([]TransactionData, 0, len(rawTransactions))
	
	for i, raw := range rawTransactions {
		transaction, err := s.convertRawTransaction(raw)
		if err != nil {
			s.logger.Warn().
				Err(err).
				Int("transaction_index", i).
				Msg("Failed to convert transaction, skipping")
			continue
		}
		transactions = append(transactions, transaction)
	}

	if len(transactions) == 0 {
		return nil, fmt.Errorf("no valid transactions found in response")
	}

	return transactions, nil
}

// convertRawTransaction converts a raw map to TransactionData
func (s *NeuralInputService) convertRawTransaction(raw map[string]interface{}) (TransactionData, error) {
	var transaction TransactionData

	// Parse amount
	amountStr, ok := raw["amount"].(string)
	if !ok {
		return transaction, fmt.Errorf("amount is required and must be a string")
	}
	
	amount, err := decimal.NewFromString(amountStr)
	if err != nil {
		return transaction, fmt.Errorf("invalid amount format: %s", amountStr)
	}
	transaction.Amount = amount

	// Parse type
	transactionType, ok := raw["type"].(string)
	if !ok {
		return transaction, fmt.Errorf("type is required")
	}
	
	// Validate transaction type
	switch transactionType {
	case "income", "expense", "transfer":
		transaction.Type = transactionType
	default:
		return transaction, fmt.Errorf("invalid transaction type: %s", transactionType)
	}

	// Parse currency code
	currencyCode, ok := raw["currency_code"].(string)
	if !ok {
		transaction.CurrencyCode = "USD" // Default
	} else {
		transaction.CurrencyCode = currencyCode
	}

	// Parse optional string fields
	if desc, ok := raw["description"].(string); ok && desc != "" {
		transaction.Description = &desc
	}
	
	if category, ok := raw["category_hint"].(string); ok && category != "" {
		transaction.CategoryHint = &category
	}
	
	if merchant, ok := raw["merchant_name"].(string); ok && merchant != "" {
		transaction.MerchantName = &merchant
	}
	
	if medium, ok := raw["payment_medium"].(string); ok && medium != "" {
		transaction.PaymentMedium = &medium
	}
	
	if location, ok := raw["location"].(string); ok && location != "" {
		transaction.Location = &location
	}
	
	if note, ok := raw["note"].(string); ok && note != "" {
		transaction.Note = &note
	}

	// Parse datetime
	if dateStr, ok := raw["transaction_datetime"].(string); ok && dateStr != "" {
		if parsedTime, err := time.Parse(time.RFC3339, dateStr); err == nil {
			transaction.TransactionDatetime = &parsedTime
		}
	}

	// Parse confidence
	if conf, ok := raw["confidence"].(float64); ok {
		if conf >= 0.0 && conf <= 1.0 {
			transaction.Confidence = conf
		} else {
			transaction.Confidence = 0.5 // Default moderate confidence
		}
	} else {
		transaction.Confidence = 0.5 // Default moderate confidence
	}

	return transaction, nil
}