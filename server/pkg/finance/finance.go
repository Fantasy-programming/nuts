package finance

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Fantasy-Programming/nuts/config"
	"github.com/rs/zerolog"
)

var (
	ErrProviderNotSupported = errors.New("financial provider not supported")
	ErrAccountNotFound      = errors.New("account not found")
	ErrInsufficientData     = errors.New("insufficient account data from provider")
	ErrAuthenticationFailed = errors.New("authentication with provider failed")
	ErrRateLimitExceeded    = errors.New("rate limit exceeded")
)

// AccountType represents standardized account types across all providers
type AccountType string

const (
	AccountTypeChecking   AccountType = "checking"
	AccountTypeSavings    AccountType = "savings"
	AccountTypeCredit     AccountType = "credit"
	AccountTypeInvestment AccountType = "investment"
	AccountTypeLoan       AccountType = "loan"
	AccountTypeOther      AccountType = "other"
)

// Account represents a standardized account structure
type Account struct {
	ID                string      `json:"id"`
	Name              string      `json:"name"`
	Type              AccountType `json:"type"`
	Balance           float64     `json:"balance"`
	AvailableBalance  *float64    `json:"available_balance,omitempty"`
	Currency          string      `json:"currency"`
	AccountNumber     *string     `json:"account_number,omitempty"`
	RoutingNumber     *string     `json:"routing_number,omitempty"`
	InstitutionName   string      `json:"institution_name"`
	InstitutionID     string      `json:"institution_id"`
	LastUpdated       time.Time   `json:"last_updated"`
	IsActive          bool        `json:"is_active"`
	ProviderAccountID string      `json:"provider_account_id"`
	EnrollmentID      *string     `json:"enrollment_id,omitempty"`
	Status            *string     `json:"status,omitempty"`
	Subtype           *string     `json:"subtype,omitempty"`
	ResourceID        *string     `json:"resource_id,omitempty"`
	ExpiresAt         *time.Time  `json:"expires_at,omitempty"`
}

// Transaction represents a standardized transaction structure
type Transaction struct {
	ID                    string            `json:"id"`
	AccountID             string            `json:"account_id"`
	Amount                float64           `json:"amount"`
	Currency              string            `json:"currency"`
	Description           string            `json:"description"`
	Category              *string           `json:"category,omitempty"`
	Date                  time.Time         `json:"date"`
	MerchantName          *string           `json:"merchant_name,omitempty"`
	Type                  string            `json:"type"`   // debit, credit
	Status                string            `json:"status"` // pending, posted
	ProviderTransactionID string            `json:"provider_transaction_id"`
	Metadata              map[string]string `json:"metadata,omitempty"`
}

// Institution represents a financial institution
type Institution struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Logo     string `json:"logo,omitempty"`
	Website  string `json:"website,omitempty"`
	Primary  string `json:"primary_color,omitempty"`
	Provider string `json:"provider"`
	// Countries                 []string `json:"countries"`
	// AvailableHistory         int    `json:"available_history,omitempty"`
	// MaximumConsentValidity   int    `json:"maximum_consent_validity,omitempty"`
	// Type                     string `json:"type,omitempty"` // personal/business
}

// LinkTokenRequest represents the request to create a link token
type LinkTokenRequest struct {
	UserID       string   `json:"user_id"`
	Products     []string `json:"products,omitempty"`
	CountryCodes []string `json:"country_codes,omitempty"`
	RedirectURI  string   `json:"redirect_uri,omitempty"`
}

// LinkTokenResponse represents the response from creating a link token
type LinkTokenResponse struct {
	LinkToken string    `json:"link_token"`
	ExpiresAt time.Time `json:"expires_at"`
}

// ExchangeTokenRequest represents the request to exchange a public token
type ExchangeTokenRequest struct {
	PublicToken string `json:"public_token"`
	UserID      string `json:"user_id"`
}

// ExchangeTokenResponse represents the response from exchanging a token
type ExchangeTokenResponse struct {
	AccessToken string `json:"access_token"`
	ItemID      string `json:"item_id,omitempty"`
}

type GetTransactionsArgs struct {
	Count     int
	FromID    string
	startDate time.Time
	endDate   time.Time
}

// Provider defines the interface for financial data providers
type Provider interface {
	// Authentication & Setup
	CreateLinkToken(ctx context.Context, req LinkTokenRequest) (*LinkTokenResponse, error)
	ExchangePublicToken(ctx context.Context, req ExchangeTokenRequest) (*ExchangeTokenResponse, error)

	// Account Operations
	GetAccounts(ctx context.Context, accessToken string) ([]Account, error)
	GetAccount(ctx context.Context, accessToken, accountID string) (*Account, error)
	GetAccountBalance(ctx context.Context, accessToken, accountID string) (*Account, error)

	// Transaction Operations
	GetTransactions(ctx context.Context, accessToken, accountID string, args GetTransactionsArgs) ([]Transaction, error)
	GetRecentTransactions(ctx context.Context, accessToken, accountID string, count int) ([]Transaction, error)

	// Institution Operations
	GetInstitutions(ctx context.Context) ([]Institution, error)
	GetInstitution(ctx context.Context, institutionID string) (*Institution, error)
	SearchInstitutions(ctx context.Context, query string) ([]Institution, error)

	// Connection Management
	GetConnectionStatus(ctx context.Context, accessToken string) (bool, error)
	RefreshConnection(ctx context.Context, accessToken string) error
	RemoveConnection(ctx context.Context, accessToken string) error

	// Provider Info
	GetProviderName() string
	GetSupportedCountries() []string
	GetSupportedAccountTypes() []AccountType
}

// ProviderManager manages multiple financial providers
type ProviderManager struct {
	providers map[string]Provider
	logger    *zerolog.Logger
}

// NewProviderManager creates a new provider manager
func NewProviderManager(cfg config.Integrations, logger *zerolog.Logger) (*ProviderManager, error) {
	pm := &ProviderManager{
		providers: make(map[string]Provider),
		logger:    logger,
	}

	// Initialize enabled providers
	for _, providerName := range cfg.EnabledFinancialProviders {
		provider, err := createProvider(providerName, cfg, logger)
		if err != nil {
			return nil, fmt.Errorf("failed to initialize provider %s: %w", providerName, err)
		}
		pm.providers[providerName] = provider
		logger.Info().Str("provider", providerName).Msg("Financial provider initialized")
	}

	if len(pm.providers) == 0 {
		return nil, errors.New("no financial providers configured")
	}

	return pm, nil
}

// GetProvider returns a specific provider by name
func (pm *ProviderManager) GetProvider(name string) (Provider, error) {
	provider, exists := pm.providers[name]
	if !exists {
		return nil, fmt.Errorf("provider %s not found or not enabled", name)
	}
	return provider, nil
}

// GetAvailableProviders returns all available provider names
func (pm *ProviderManager) GetAvailableProviders() []string {
	providers := make([]string, 0, len(pm.providers))
	for name := range pm.providers {
		providers = append(providers, name)
	}
	return providers
}

// GetAllAccounts retrieves accounts from all providers for a user
func (pm *ProviderManager) GetAllAccounts(ctx context.Context, userAccessTokens map[string]string) (map[string][]Account, error) {
	results := make(map[string][]Account)

	for providerName, provider := range pm.providers {
		accessToken, exists := userAccessTokens[providerName]
		if !exists {
			continue // User hasn't connected this provider
		}

		accounts, err := provider.GetAccounts(ctx, accessToken)
		if err != nil {
			pm.logger.Error().
				Err(err).
				Str("provider", providerName).
				Msg("Failed to get accounts from provider")
			continue // Continue with other providers
		}

		results[providerName] = accounts
	}

	return results, nil
}

// createProvider creates a specific provider instance based on configuration
func createProvider(name string, cfg config.Integrations, logger *zerolog.Logger) (Provider, error) {
	switch name {
	case "plaid":
		return NewPlaidProvider(PlaidConfig{
			Environment: cfg.PlaidEnvironment,
			ClientID:    cfg.PlaidClientId,
			Secret:      cfg.PlaidSecret,
			BaseURL:     cfg.PlaidBaseUri,
		}, logger)
	case "teller":
		return NewTellerProvider(TellerConfig{BaseURL: cfg.TellerBaseUri}, logger)
	case "gocardless":
		// return NewGoCardlessProvider(cfg.GoCardless, logger)
	case "mono":
		// return NewMonoProvider(cfg.Mono, logger)
	case "brankas":
		// return NewBrankasProvider(cfg.Brankas, logger)
	default:
		return nil, fmt.Errorf("unsupported financial provider: %s", name)
	}
	return nil, fmt.Errorf("unsupported financial provider: %s", name)
}
