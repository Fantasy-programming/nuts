package finance

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/rs/zerolog"
)

type TellerConfig struct {
	Environment        string
	BaseURL            string
	CertPath           string
	CertPrivateKeyPath string
}

// TellerProvider implements the Provider interface for Teller
type TellerProvider struct {
	config     TellerConfig
	httpClient *http.Client
	logger     *zerolog.Logger
	baseURL    string
}

// Teller API response structures
type tellerAccount struct {
	ID           string            `json:"id"`
	Name         string            `json:"name"`
	Type         string            `json:"type"`
	Subtype      string            `json:"subtype"`
	Status       string            `json:"status"`
	Currency     string            `json:"currency"`
	Institution  tellerInstitution `json:"institution"`
	LastFour     string            `json:"last_four"`
	Links        map[string]any    `json:"links"`
	Details      map[string]any    `json:"details"`
	EnrollmentID string            `json:"enrollment_id"`
	Balance      tellerBalance     `json:"balance"`
}

type tellerBalance struct {
	Available float64 `json:"available,string"`
	Ledger    float64 `json:"ledger,string"`
}
type tellerTransactionDetailsCounterParty struct {
	Name *string `json:"name"`
	Type *string `json:"type"`
}

type tellerTransactionDetails struct {
	ProcessingStatus string                               `json:"processing_status"`  // Either pending or complete.
	Category         *string                              `json:"category,omitempty"` // accommodation, advertising, bar, charity, clothing, dining, education, electronics, entertainment, fuel, general, groceries, health, home, income, insurance, investment, loan, office, phone, service, shopping, software, sport, tax, transport, transportation, and utilities.
	CounterParty     tellerTransactionDetailsCounterParty `json:"counterparty,omitempty"`
}

type tellerTransaction struct {
	Details        tellerTransactionDetails `json:"details"`
	RunningBalance string                   `json:"running_balance"`
	Description    string                   `json:"description"`
	ID             string                   `json:"id"`
	Date           string                   `json:"date"`
	AccountID      string                   `json:"account_id"`
	Links          map[string]any           `json:"links"`
	Amount         string                   `json:"amount"`
	Status         string                   `json:"status"`
	Type           string                   `json:"type"`
}

type tellerInstitution struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	PrimaryColor string `json:"primary_color"`
	Logo         string `json:"logo"`
}

type tellerConnectResponse struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
}

func NewTellerProvider(config TellerConfig, logger *zerolog.Logger) (*TellerProvider, error) {
	hasCert := config.CertPath != "" && config.CertPrivateKeyPath != ""
	var tlsConfig *tls.Config

	if config.Environment != "sandbox" {
		if !hasCert {
			return nil, fmt.Errorf("env: Tls certs (base + private) path not set in environment variables")
		}

		cert, err := tls.LoadX509KeyPair(config.CertPath, config.CertPrivateKeyPath)
		if err != nil {
			return nil, fmt.Errorf("error loading certificate files")
		}

		tlsConfig = &tls.Config{
			Certificates: []tls.Certificate{cert},
			MinVersion:   tls.VersionTLS12,
		}

	}

	transport := &http.Transport{
		TLSClientConfig:       tlsConfig,
		MaxIdleConns:          100,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second, // Added
	}

	httpClient := &http.Client{
		Transport: transport,
		Timeout:   30 * time.Second,
	}

	return &TellerProvider{
		config:     config,
		httpClient: httpClient,
		logger:     logger,
		baseURL:    config.BaseURL,
	}, nil
}

// IGNORE
func (t *TellerProvider) CreateLinkToken(ctx context.Context, req LinkTokenRequest) (*LinkTokenResponse, error) {
	return &LinkTokenResponse{}, nil
}

// IGNORE
func (t *TellerProvider) ExchangePublicToken(ctx context.Context, req ExchangeTokenRequest) (*ExchangeTokenResponse, error) {
	return &ExchangeTokenResponse{}, nil
}

func (t *TellerProvider) GetAccounts(ctx context.Context, accessToken string) ([]Account, error) {
	resp, err := t.makeRequest(ctx, "GET", "/accounts", nil, accessToken)
	if err != nil {
		return nil, fmt.Errorf("failed to get accounts: %w", err)
	}

	var tellerAccounts []tellerAccount

	if err := json.Unmarshal(resp, &tellerAccounts); err != nil {
		return nil, fmt.Errorf("failed to parse accounts response: %w", err)
	}

	accounts := make([]Account, 0, len(tellerAccounts))
	for _, ta := range tellerAccounts {

		fullAccount, err := t.GetAccountBalanceInternal(ctx, accessToken, ta.ID)
		if err != nil {
			t.logger.Warn().Err(err).Str("account_id", ta.ID).Msg("Failed to fetch full account balance")
			continue
		}

		ta.Balance = *fullAccount

		account := t.convertTellerAccount(ta)
		accounts = append(accounts, account)
	}

	return accounts, nil
}

func (t *TellerProvider) GetAccount(ctx context.Context, accessToken, accountID string) (*Account, error) {
	resp, err := t.makeRequest(ctx, "GET", fmt.Sprintf("/accounts/%s", accountID), nil, accessToken)
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %w", err)
	}

	var tellerAccount tellerAccount
	if err := json.Unmarshal(resp, &tellerAccount); err != nil {
		return nil, fmt.Errorf("failed to parse account response: %w", err)
	}

	accountBalance, err := t.GetAccountBalanceInternal(ctx, accessToken, tellerAccount.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %w", err)
	}

	tellerAccount.Balance = *accountBalance

	account := t.convertTellerAccount(tellerAccount)
	return &account, nil
}

func (t *TellerProvider) GetAccountBalance(ctx context.Context, accessToken, accountID string) (*Account, error) {
	// For Teller, balance is included in the account data
	return t.GetAccount(ctx, accessToken, accountID)
}

func (t *TellerProvider) GetAccountBalanceInternal(ctx context.Context, accessToken, accountID string) (*tellerBalance, error) {
	resp, err := t.makeRequest(ctx, "GET", fmt.Sprintf("/accounts/%s/balances", accountID), nil, accessToken)
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %w", err)
	}

	t.logger.Debug().RawJSON("balanceErr", resp).Msg("balance")

	var tellerBalance tellerBalance
	if err := json.Unmarshal(resp, &tellerBalance); err != nil {
		return nil, fmt.Errorf("failed to parse account balance response: %w", err)
	}

	t.logger.Debug().Any("balanceErrTeller", tellerBalance)

	return &tellerBalance, nil
}

// GetTransactions retrieves transactions for an account within a date range
func (t *TellerProvider) GetTransactions(ctx context.Context, accessToken, accountID string, args GetTransactionsArgs) ([]Transaction, error) {
	params := url.Values{}

	if args.Count != nil {
		params.Set("count", strconv.Itoa(*args.Count))
	}
	if args.FromID != nil {
		params.Set("from_id", *args.FromID)
	}
	// You could add logic here for startDate and endDate if the API supports them

	endpoint := fmt.Sprintf("/accounts/%s/transactions", accountID)
	if encoded := params.Encode(); encoded != "" {
		endpoint += "?" + encoded
	}

	resp, err := t.makeRequest(ctx, "GET", endpoint, nil, accessToken)
	if err != nil {
		return nil, fmt.Errorf("failed to get transactions: %w", err)
	}

	var tellerTransactions []tellerTransaction
	if err := json.Unmarshal(resp, &tellerTransactions); err != nil {
		return nil, fmt.Errorf("failed to parse transactions response: %w", err)
	}

	transactions := make([]Transaction, 0, len(tellerTransactions))
	for _, tt := range tellerTransactions {
		transaction, err := t.convertTellerTransaction(tt, accountID)
		if err != nil {
			t.logger.Warn().Err(err).Str("transaction_id", tt.ID).Msg("Failed to convert transaction")
			continue
		}
		transactions = append(transactions, transaction)
	}

	return transactions, nil
}

// IGNORE
func (t *TellerProvider) GetRecentTransactions(ctx context.Context, accessToken, accountID string, count int) ([]Transaction, error) {
	return nil, nil
}

// GetInstitutions retrieves all supported institutions
func (t *TellerProvider) GetInstitutions(ctx context.Context) ([]Institution, error) {
	resp, err := t.makeRequest(ctx, "GET", "/institutions", nil, "")
	if err != nil {
		return nil, fmt.Errorf("failed to get institutions: %w", err)
	}

	var tellerInstitutions []tellerInstitution
	if err := json.Unmarshal(resp, &tellerInstitutions); err != nil {
		return nil, fmt.Errorf("failed to parse institutions response: %w", err)
	}

	institutions := make([]Institution, 0, len(tellerInstitutions))
	for _, ti := range tellerInstitutions {
		institution := Institution{
			ID:       ti.ID,
			Name:     ti.Name,
			Logo:     ti.Logo,
			Primary:  ti.PrimaryColor,
			Provider: "teller",
		}
		institutions = append(institutions, institution)
	}

	return institutions, nil
}

// IGNORE
func (t *TellerProvider) GetInstitution(ctx context.Context, institutionID string) (*Institution, error) {
	return &Institution{}, nil
}

// IGNORE
func (t *TellerProvider) SearchInstitutions(ctx context.Context, query string) ([]Institution, error) {
	return nil, nil
}

// GetConnectionStatus checks if the connection is still valid
func (t *TellerProvider) GetConnectionStatus(ctx context.Context, accessToken string) (bool, error) {
	_, err := t.makeRequest(ctx, "GET", "/accounts", nil, accessToken)
	if err != nil {
		if strings.Contains(err.Error(), "401") || strings.Contains(err.Error(), "403") {
			return false, nil
		}
		return false, fmt.Errorf("failed to check connection status: %w", err)
	}
	return true, nil
}

// IGNORE (Teller connections don't typically need manual refresh)
func (t *TellerProvider) RefreshConnection(ctx context.Context, accessToken string) error {
	return nil
}

// RemoveConnection removes/disconnects the account connection (TODO: Adapt this to teller (add account_id))
func (t *TellerProvider) RemoveConnection(ctx context.Context, accessToken string) error {
	endpoint := fmt.Sprintf("/accounts/%s", "id_here")
	_, err := t.makeRequest(ctx, "DELETE", endpoint, nil, accessToken)
	if err != nil {
		return fmt.Errorf("failed to remove connection: %w", err)
	}
	return nil
}

// GetProviderName returns the provider name
func (t *TellerProvider) GetProviderName() string {
	return "teller"
}

// GetSupportedCountries returns supported countries
func (t *TellerProvider) GetSupportedCountries() []string {
	return []string{"US", "CA"} // Teller primarily supports US and Canada
}

// GetSupportedAccountTypes returns supported account types
func (t *TellerProvider) GetSupportedAccountTypes() []AccountType {
	return []AccountType{
		AccountTypeCredit,
		AccountTypeInvestment,
		AccountTypeLoan,
	}
}

// Helper methods

// makeRequest makes an HTTP request to the Teller API
func (t *TellerProvider) makeRequest(ctx context.Context, method, endpoint string, body any, accessToken string) ([]byte, error) {
	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequestWithContext(ctx, method, t.baseURL+endpoint, reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "nuts-finance/1.0")

	// Authentication
	if accessToken != "" {
		req.SetBasicAuth(accessToken, "")
	} else {
		return nil, fmt.Errorf("accessToken is empty")
	}

	resp, err := t.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode >= 400 {
		t.logger.Error().
			Int("status_code", resp.StatusCode).
			Str("response_body", string(respBody)).
			Str("endpoint", endpoint).
			Msg("Teller API error")

		var tellerErr struct {
			Error struct {
				Code    string `json:"code"`
				Message string `json:"message"`
			} `json:"error"`
		}
		_ = json.Unmarshal(respBody, &tellerErr)

		switch resp.StatusCode {
		case 401, 403:
			return nil, fmt.Errorf("authentication failed: %s (%s)", tellerErr.Error.Message, tellerErr.Error.Code)
		case 404:
			return nil, fmt.Errorf("not found: %s (%s)", tellerErr.Error.Message, tellerErr.Error.Code)
		case 410:
			return nil, fmt.Errorf("gone: %s (%s)", tellerErr.Error.Message, tellerErr.Error.Code)
		case 422:
			return nil, fmt.Errorf("unprocessable entity: %s (%s)", tellerErr.Error.Message, tellerErr.Error.Code)
		case 429:
			return nil, fmt.Errorf("rate limit exceeded: %s (%s)", tellerErr.Error.Message, tellerErr.Error.Code)
		case 502:
			return nil, fmt.Errorf("bad gateway: %s (%s)", tellerErr.Error.Message, tellerErr.Error.Code)
		default:
			return nil, fmt.Errorf("API error: %d - %s (%s)", resp.StatusCode, tellerErr.Error.Message, tellerErr.Error.Code)
		}
	}

	return respBody, nil
}

// convertTellerAccount converts a Teller account to the standard Account struct
func (t *TellerProvider) convertTellerAccount(ta tellerAccount) Account {
	accountType, accountSubType := t.mapTellerAccountType(ta.Type, ta.Subtype)

	var availableBalance *float64
	if ta.Balance.Available != 0 {
		availableBalance = &ta.Balance.Available
	}

	var accountNumber *string
	if ta.LastFour != "" {
		masked := "****" + ta.LastFour
		accountNumber = &masked
	}

	return Account{
		ID:                ta.ID,
		Name:              ta.Name,
		Type:              accountType,
		Balance:           ta.Balance.Ledger,
		AvailableBalance:  availableBalance,
		Currency:          strings.ToUpper(ta.Currency),
		AccountNumber:     accountNumber,
		InstitutionName:   ta.Institution.Name,
		InstitutionID:     ta.Institution.ID,
		LastUpdated:       time.Now(),
		IsActive:          ta.Status == "open",
		ProviderAccountID: ta.ID,
		EnrollmentID:      &ta.EnrollmentID,
		Subtype:           &accountSubType,
		Status:            &ta.Status,
	}
}

// convertTellerTransaction converts a Teller transaction to the standard Transaction struct
func (t *TellerProvider) convertTellerTransaction(tt tellerTransaction, accountID string) (Transaction, error) {
	amount, err := strconv.ParseFloat(tt.Amount, 64)
	if err != nil {
		return Transaction{}, fmt.Errorf("failed to parse amount: %w", err)
	}

	date, err := time.Parse("2006-01-02", tt.Date)
	if err != nil {
		return Transaction{}, fmt.Errorf("failed to parse date: %w", err)
	}

	return Transaction{
		ID:                    tt.ID,
		AccountID:             accountID,
		Amount:                amount,
		Currency:              "USD", // Teller typically uses USD
		Description:           tt.Description,
		Category:              tt.Details.Category,
		Date:                  date,
		MerchantName:          tt.Details.CounterParty.Name,
		Type:                  strings.ToLower(tt.Type),
		Status:                strings.ToLower(tt.Status),
		ProviderTransactionID: tt.ID,
		Metadata: map[string]string{
			"running_balance": tt.RunningBalance,
		},
	}, nil
}

// mapTellerAccountType maps Teller account types to standard account types
func (t *TellerProvider) mapTellerAccountType(accountType, subtype string) (AccountType, AccountSubType) {
	switch strings.ToLower(accountType) {
	case "depository":
		switch strings.ToLower(subtype) { // also money_market, certificate_of_deposit, treasury, sweep
		case "checking":
			return AccountTypeCash, AccountTypeChecking
		case "savings":
			return AccountTypeCash, AccountTypeSavings
		default:
			t.logger.Debug().Str("account_sub_type", subtype).Msg("could not find subtype")
			return AccountTypeCash, AccountTypeChecking
		}
	case "credit":
		return AccountTypeCredit, AccountTypeCards
	case "loan":
		return AccountTypeLoan, AccountSTypeLoan
	case "investment":
		switch strings.ToLower(subtype) {
		case "checking":
			return AccountTypeCash, AccountTypeChecking
		case "savings":
			return AccountTypeCash, AccountTypeSavings
		default:
			t.logger.Debug().Str("account_sub_type", subtype).Msg("could not find subtype")
			return AccountTypeInvestment, AccountSTypeInvestment
		}
	default:
		t.logger.Debug().Str("account_type", subtype).Msg("could not find type")
		return AccountTypeOther, AccountSubType(subtype)
	}
}
