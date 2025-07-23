# LLM Package - Neural Input for Transaction Parsing

This package provides AI-powered transaction parsing capabilities for the Nuts finance application. It allows users to input ambiguous natural language descriptions of transactions and automatically converts them into structured transaction data.

## Features

- **Dual Provider Support**: Choose between local (Ollama) and remote (Gemini, OpenAI, Claude, OpenRouter) LLM providers
- **Smart Transaction Parsing**: Convert natural language to structured transaction data
- **Multi-transaction Support**: Parse multiple transactions from a single input
- **Confidence Scoring**: Each parsed transaction includes a confidence score
- **Comprehensive Prompting**: Advanced prompts optimized for financial transaction extraction
- **Type Safety**: Full Go type safety with proper validation

## Supported Providers

### Local Provider (Ollama)
- **Default Model**: `gemma2:2b`
- **Endpoint**: `http://localhost:11434` (configurable)
- **Benefits**: Privacy, no API costs, offline capability
- **Requirements**: Ollama server running locally

### Remote Providers
- **Gemini** (default): Google's Gemini models
- **OpenAI**: ChatGPT models  
- **Claude**: Anthropic's Claude models
- **OpenRouter**: Access to multiple models via OpenRouter

## Configuration

Configure via environment variables with the `LLM_` prefix:

```bash
# Provider selection
LLM_PROVIDER=local          # "local" or "remote"

# Local provider settings (Ollama)
LLM_LOCAL_MODEL=gemma2:2b   # Model name
LLM_LOCAL_ENDPOINT=http://localhost:11434

# Remote provider settings  
LLM_REMOTE_PROVIDER=gemini  # "gemini", "openai", "claude", "openrouter"
LLM_REMOTE_API_KEY=your_api_key_here
LLM_REMOTE_MODEL=gemini-1.5-flash

# General settings
LLM_MAX_TOKENS=1000         # Maximum tokens in response
LLM_TEMPERATURE=0.1         # Creativity level (0.0-2.0)
LLM_TIMEOUT_SEC=30          # Request timeout in seconds
```

## Usage

### Basic Setup

```go
import (
    "github.com/Fantasy-Programming/nuts/server/pkg/llm"
    "github.com/rs/zerolog"
)

// Create service
config := llm.NewConfig()
logger := zerolog.New(os.Stdout)
service, err := llm.NewService(config, &logger)
if err != nil {
    log.Fatal(err)
}
```

### Parsing Transactions

```go
// Prepare request
request := llm.NeuralInputRequest{
    Input:          "Bought lunch at McDonald's for $12.50 yesterday",
    BaseCurrency:   stringPtr("USD"),
    UserTimezone:   stringPtr("America/New_York"),
    AccountContext: stringPtr("Personal checking account"),
}

// Parse transactions
response, err := service.ParseTransactions(context.Background(), request)
if err != nil {
    log.Fatal(err)
}

// Use results
for _, txn := range response.Transactions {
    fmt.Printf("Amount: %s, Type: %s, Description: %s, Confidence: %.2f\n",
        txn.Amount.String(), txn.Type, *txn.Description, txn.Confidence)
}
```

### HTTP Handler Integration

```go
// In your router setup
llmService, _ := llm.NewService(config, logger)
neuralHandler := transactions.NewNeuralInputHandler(validator, llmService, logger)

router.Post("/transactions/neural-input", neuralHandler.ParseTransactions)
```

## API Endpoint

### POST /transactions/neural-input

Parse natural language input into structured transactions.

#### Request Body
```json
{
    "input": "Had lunch for $15 and bought gas for $45",
    "user_timezone": "America/New_York",
    "base_currency": "USD", 
    "account_context": "Personal checking account"
}
```

#### Response
```json
{
    "transactions": [
        {
            "amount": "15.00",
            "type": "expense",
            "description": "Lunch",
            "category_hint": "food",
            "currency_code": "USD",
            "confidence": 0.85
        },
        {
            "amount": "45.00", 
            "type": "expense",
            "description": "Gas",
            "category_hint": "transport",
            "currency_code": "USD",
            "confidence": 0.90
        }
    ],
    "parsed_at": "2024-01-15T10:30:00Z",
    "model": "gemma2:2b",
    "provider": "local"
}
```

## Example Inputs

The system can handle various natural language inputs:

```
"Bought coffee at Starbucks for $4.50"
"Paid rent $1200 last month"
"Got paid $3000 salary on Friday"
"Lunch $25, gas $40, groceries $85 yesterday"
"Transferred $500 from checking to savings"
"$50 cash withdrawal from ATM"
"Dinner with friends - split $120 between 4 people"
```

## Transaction Fields

Each parsed transaction includes:

- **amount**: Decimal amount (required)
- **type**: "income", "expense", or "transfer" (required)  
- **description**: Brief description (optional)
- **category_hint**: Suggested category (optional)
- **merchant_name**: Business/vendor name (optional)
- **transaction_datetime**: Parsed date/time (optional)
- **currency_code**: 3-letter currency code (defaults to base currency)
- **payment_medium**: Payment method like "credit_card", "cash" (optional)
- **location**: Location if mentioned (optional)
- **note**: Additional notes (optional)
- **confidence**: AI confidence score 0.0-1.0 (required)

## Error Handling

The service handles various error conditions:

- **Invalid JSON response** from LLM
- **Missing required fields** in parsed data
- **Network errors** for remote providers
- **Authentication errors** for API keys
- **Timeout errors** for slow responses

## Testing

Run the test suite:

```bash
go test ./pkg/llm/... -v
```

Tests include:
- Mock provider testing
- Transaction parsing validation
- Configuration validation
- Error handling scenarios
- Prompt building verification

## Performance Considerations

- **Local providers** are faster but require local setup
- **Remote providers** have network latency but better accuracy
- **Token limits** prevent runaway costs
- **Timeouts** prevent hanging requests
- **Confidence scores** help filter low-quality results

## Security

- API keys are configured via environment variables
- No sensitive data is logged
- Request/response data is sanitized
- Timeout prevents resource exhaustion