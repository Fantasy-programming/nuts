package llm

import (
	"context"
	"testing"

	"github.com/rs/zerolog"
	"github.com/shopspring/decimal"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// MockProvider implements the Provider interface for testing
type MockProvider struct {
	response  string
	err       error
	modelInfo ModelInfo
}

func (m *MockProvider) GenerateCompletion(ctx context.Context, prompt string) (string, error) {
	return m.response, m.err
}

func (m *MockProvider) GetModelInfo() ModelInfo {
	return m.modelInfo
}

func TestNeuralInputService_ParseTransactions(t *testing.T) {
	logger := zerolog.Nop()
	
	tests := []struct {
		name           string
		mockResponse   string
		mockError      error
		request        NeuralInputRequest
		expectedTxns   int
		expectedError  bool
	}{
		{
			name: "successful single transaction parsing",
			mockResponse: `[{
				"amount": "25.50",
				"type": "expense",
				"description": "Coffee at Starbucks",
				"category_hint": "food",
				"merchant_name": "Starbucks",
				"transaction_datetime": "2024-01-15T09:30:00Z",
				"currency_code": "USD",
				"payment_medium": "credit_card",
				"location": "Downtown",
				"note": "Morning coffee",
				"confidence": 0.95
			}]`,
			request: NeuralInputRequest{
				Input:        "Bought coffee at Starbucks for $25.50",
				BaseCurrency: stringPtr("USD"),
			},
			expectedTxns: 1,
		},
		{
			name: "multiple transactions",
			mockResponse: `[{
				"amount": "15.00",
				"type": "expense",
				"description": "Lunch",
				"category_hint": "food",
				"currency_code": "USD",
				"confidence": 0.8
			}, {
				"amount": "50.00",
				"type": "expense", 
				"description": "Gas",
				"category_hint": "transport",
				"currency_code": "USD",
				"confidence": 0.9
			}]`,
			request: NeuralInputRequest{
				Input: "Had lunch for $15 and filled up gas tank for $50",
			},
			expectedTxns: 2,
		},
		{
			name: "invalid JSON response",
			mockResponse: "invalid json {",
			request: NeuralInputRequest{
				Input: "Test input",
			},
			expectedError: true,
		},
		{
			name: "empty transaction array",
			mockResponse: "[]",
			request: NeuralInputRequest{
				Input: "No financial content here",
			},
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockProvider := &MockProvider{
				response: tt.mockResponse,
				err:      tt.mockError,
				modelInfo: ModelInfo{
					Name:     "test-model",
					Provider: "test",
					Type:     "local",
				},
			}

			service := &NeuralInputService{
				provider: mockProvider,
				config:   Config{Provider: "local"},
				logger:   &logger,
			}

			result, err := service.ParseTransactions(context.Background(), tt.request)

			if tt.expectedError {
				assert.Error(t, err)
				return
			}

			require.NoError(t, err)
			assert.Equal(t, tt.expectedTxns, len(result.Transactions))
			assert.Equal(t, "test-model", result.Model)
			assert.Equal(t, "local", result.Provider)
			
			if len(result.Transactions) > 0 {
				txn := result.Transactions[0]
				assert.True(t, txn.Amount.GreaterThan(decimal.Zero))
				assert.Contains(t, []string{"income", "expense", "transfer"}, txn.Type)
				assert.NotEmpty(t, txn.CurrencyCode)
				assert.GreaterOrEqual(t, txn.Confidence, 0.0)
				assert.LessOrEqual(t, txn.Confidence, 1.0)
			}
		})
	}
}

func TestNeuralInputService_convertRawTransaction(t *testing.T) {
	logger := zerolog.Nop()
	service := &NeuralInputService{
		logger: &logger,
	}

	tests := []struct {
		name        string
		raw         map[string]interface{}
		expectError bool
		expected    TransactionData
	}{
		{
			name: "valid transaction",
			raw: map[string]interface{}{
				"amount":                "100.50",
				"type":                  "expense",
				"description":           "Grocery shopping",
				"category_hint":         "food",
				"merchant_name":         "Whole Foods",
				"transaction_datetime":  "2024-01-15T14:30:00Z",
				"currency_code":         "USD",
				"payment_medium":        "credit_card",
				"location":              "Seattle",
				"note":                  "Weekly groceries",
				"confidence":            0.95,
			},
			expected: TransactionData{
				Amount:       decimal.NewFromFloat(100.50),
				Type:         "expense",
				Description:  stringPtr("Grocery shopping"),
				CategoryHint: stringPtr("food"),
				MerchantName: stringPtr("Whole Foods"),
				CurrencyCode: "USD",
				PaymentMedium: stringPtr("credit_card"),
				Location:     stringPtr("Seattle"),
				Note:         stringPtr("Weekly groceries"),
				Confidence:   0.95,
			},
		},
		{
			name: "missing amount",
			raw: map[string]interface{}{
				"type": "expense",
			},
			expectError: true,
		},
		{
			name: "invalid transaction type",
			raw: map[string]interface{}{
				"amount": "50.00",
				"type":   "invalid_type",
			},
			expectError: true,
		},
		{
			name: "minimal valid transaction",
			raw: map[string]interface{}{
				"amount": "25.00",
				"type":   "income",
			},
			expected: TransactionData{
				Amount:       decimal.NewFromFloat(25.00),
				Type:         "income",
				CurrencyCode: "USD", // Default
				Confidence:   0.5,   // Default
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := service.convertRawTransaction(tt.raw)

			if tt.expectError {
				assert.Error(t, err)
				return
			}

			require.NoError(t, err)
			assert.True(t, result.Amount.Equal(tt.expected.Amount))
			assert.Equal(t, tt.expected.Type, result.Type)
			assert.Equal(t, tt.expected.CurrencyCode, result.CurrencyCode)
			assert.Equal(t, tt.expected.Confidence, result.Confidence)

			if tt.expected.Description != nil {
				require.NotNil(t, result.Description)
				assert.Equal(t, *tt.expected.Description, *result.Description)
			}
		})
	}
}

func TestValidateConfig(t *testing.T) {
	tests := []struct {
		name        string
		config      Config
		expectError bool
	}{
		{
			name: "valid local config",
			config: Config{
				Provider:      "local",
				LocalEndpoint: "http://localhost:11434",
				LocalModel:    "gemma2:2b",
				MaxTokens:     1000,
				Temperature:   0.1,
				TimeoutSec:    30,
			},
			expectError: false,
		},
		{
			name: "valid remote config",
			config: Config{
				Provider:       "remote",
				RemoteProvider: "gemini",
				RemoteAPIKey:   "test-key",
				RemoteModel:    "gemini-1.5-flash",
				MaxTokens:      1000,
				Temperature:    0.1,
				TimeoutSec:     30,
			},
			expectError: false,
		},
		{
			name: "invalid provider type",
			config: Config{
				Provider: "invalid",
			},
			expectError: true,
		},
		{
			name: "local config missing endpoint",
			config: Config{
				Provider:   "local",
				LocalModel: "gemma2:2b",
				MaxTokens:  1000,
				TimeoutSec: 30,
			},
			expectError: true,
		},
		{
			name: "remote config missing API key",
			config: Config{
				Provider:       "remote",
				RemoteProvider: "gemini",
				RemoteModel:    "gemini-1.5-flash",
				MaxTokens:      1000,
				TimeoutSec:     30,
			},
			expectError: true,
		},
		{
			name: "invalid temperature",
			config: Config{
				Provider:      "local",
				LocalEndpoint: "http://localhost:11434",
				LocalModel:    "gemma2:2b",
				MaxTokens:     1000,
				Temperature:   3.0, // Too high
				TimeoutSec:    30,
			},
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateConfig(tt.config)
			if tt.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestBuildTransactionPrompt(t *testing.T) {
	logger := zerolog.Nop()
	service := &NeuralInputService{
		logger: &logger,
	}

	request := NeuralInputRequest{
		Input:          "Bought lunch for $12.50",
		BaseCurrency:   stringPtr("EUR"),
		UserTimezone:   stringPtr("Europe/London"),
		AccountContext: stringPtr("Personal checking account"),
	}

	prompt := service.buildTransactionPrompt(request)

	assert.Contains(t, prompt, "EUR")
	assert.Contains(t, prompt, "Europe/London")
	assert.Contains(t, prompt, "Personal checking account")
	assert.Contains(t, prompt, "Bought lunch for $12.50")
	assert.Contains(t, prompt, "JSON array")
}

// Helper function for tests
func stringPtr(s string) *string {
	return &s
}