package finance

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/rs/zerolog"
)

// "sandbox" | "production"
// The code from mono_connect expires in 10 minutes
// The AccountID doesn't expires unless unlinked via api

const MonoBaseURL = "https://api.withmono.com/v2"

type MonoConfig struct {
	SecretKey string `json:"secret_key"`
	BaseURL   string `json:"base_url"`
}

type MonoProvider struct {
	httpClient   *http.Client
	baseURL      string
	security_key string
}

type monoAccountIDRequest struct {
	Code string `json:"code"`
}

// Mono APi response structure
type monoAccountID struct {
	Status    string `json:"status"`
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
	Data      struct {
		ID string `json:"id"`
	} `json:"data"`
}

type monoAccountResponse struct {
	Status    string `json:"status"`
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
	Data      struct {
		Account struct {
			ID            string  `json:"id"`
			Name          string  `json:"name"`
			Currency      string  `json:"currency"`
			Type          string  `json:"type"`
			AccountNumber string  `json:"account_number"`
			Balance       float64 `json:"balance"`
			BVN           string  `json:"bvn"`
			Institution   struct {
				Name     string `json:"name"`
				BankCode string `json:"bank_code"`
				Type     string `json:"type"`
			} `json:"institution"`
		} `json:"account"`
		Meta struct {
			DataStatus string `json:"data_status"`
			AuthMethod string `json:"auth_method"`
		} `json:"meta"`
	} `json:"data"`
}

type monoTransactionData struct {
	ID        string  `json:"id"`
	Narration string  `json:"narration"`
	Amount    float64 `json:"amount"`
	Type      string  `json:"type"`
	Balance   float64 `json:"balance"`
	Date      string  `json:"date"`
	Category  string  `json:"category"`
}

type monoTransactionMeta struct {
	Total    int     `json:"total"`
	Page     int     `json:"page"`
	Previous *string `json:"previous"`
	Next     *string `json:"next"`
}

type monoTransactionsResponse struct {
	Status    string                `json:"status"`
	Message   string                `json:"message"`
	Timestamp string                `json:"timestamp"`
	Data      []monoTransactionData `json:"data"`
	Meta      monoTransactionMeta   `json:"meta"`
}

type monoErrorResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Data    any    `json:"data"`
}

func NewMonoProvider(security_key string, logger *zerolog.Logger) (*MonoProvider, error) {
	if security_key == "" {
		return nil, fmt.Errorf("env: mono secret key not set in environment variables")
	}

	return &MonoProvider{
		httpClient:   &http.Client{Timeout: 30 * time.Second},
		baseURL:      MonoBaseURL,
		security_key: security_key,
	}, nil
}

// IGNORE (Handled by connect)
func (t *MonoProvider) CreateLinkToken(ctx context.Context, req LinkTokenRequest) (*LinkTokenResponse, error) {
	return &LinkTokenResponse{}, nil
}

// TODO: Make the itemID optional
func (t *MonoProvider) ExchangePublicToken(ctx context.Context, req ExchangeTokenRequest) (*ExchangeTokenResponse, error) {
	payload := &monoAccountIDRequest{
		Code: req.PublicToken,
	}

	resp, err := t.makeRequest(ctx, "POST", "/accounts/auth", payload)
	if err != nil {
		return nil, fmt.Errorf("failed to get AccountID: %w", err)
	}

	var accountID monoAccountID

	if err := json.Unmarshal(resp, &accountID); err != nil {
		return nil, fmt.Errorf("failed to parse auth response: %w", err)
	}

	// Check if the request was successful
	if accountID.Status != "successful" {
		return nil, fmt.Errorf("auth failed: %s", accountID.Message)
	}

	return &ExchangeTokenResponse{
		AccessToken: accountID.Data.ID,
	}, nil
}

// We don't have the multiple thing with mono
func (m *MonoProvider) GetAccounts(ctx context.Context, accessToken string) ([]Account, error) {
	resp, err := m.makeRequest(ctx, "GET", fmt.Sprintf("/accounts/%s", accessToken), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get account details: %w", err)
	}

	var accountResp monoAccountResponse

	if err := json.Unmarshal(resp, &accountResp); err != nil {
		return nil, fmt.Errorf("failed to parse account response: %w", err)
	}

	// Check if the request was successful
	if accountResp.Status != "successful" {
		return nil, fmt.Errorf("get account failed: %s", accountResp.Message)
	}

	// Check if data is available
	if accountResp.Data.Meta.DataStatus != "AVAILABLE" {
		return nil, fmt.Errorf("account data not yet available, status: %s", accountResp.Data.Meta.DataStatus)
	}

	// Map Mono account type to standardized type
	accountType, accountSubType := mapMonoAccountTypeToStandard(accountResp.Data.Account.Type)

	var accounts []Account

	account := Account{
		ID:                accountResp.Data.Account.ID,
		Name:              accountResp.Data.Account.Name,
		Type:              accountType,
		Subtype:           &accountSubType,
		Balance:           accountResp.Data.Account.Balance / 100, // Convert from kobo to naira
		Currency:          accountResp.Data.Account.Currency,
		AccountNumber:     &accountResp.Data.Account.AccountNumber,
		InstitutionName:   accountResp.Data.Account.Institution.Name,
		InstitutionID:     accountResp.Data.Account.Institution.BankCode,
		LastUpdated:       time.Now(),
		IsActive:          true,
		ProviderAccountID: accessToken,
	}

	accounts = append(accounts, account)

	return accounts, nil
}

func (m *MonoProvider) GetAccount(ctx context.Context, accessToken, accountID string) (*Account, error) {
	// For Mono, accessToken and accountID are the same (Account ID)
	resp, err := m.makeRequest(ctx, "GET", fmt.Sprintf("/accounts/%s", accessToken), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get account details: %w", err)
	}

	var accountResp monoAccountResponse

	if err := json.Unmarshal(resp, &accountResp); err != nil {
		return nil, fmt.Errorf("failed to parse account response: %w", err)
	}

	// Check if the request was successful
	if accountResp.Status != "successful" {
		return nil, fmt.Errorf("get account failed: %s", accountResp.Message)
	}

	// Check if data is available
	if accountResp.Data.Meta.DataStatus != "AVAILABLE" {
		return nil, fmt.Errorf("account data not yet available, status: %s", accountResp.Data.Meta.DataStatus)
	}

	// Map Mono account type to standardized type
	accountType, accountSubType := mapMonoAccountTypeToStandard(accountResp.Data.Account.Type)

	account := &Account{
		ID:                accountResp.Data.Account.ID,
		Name:              accountResp.Data.Account.Name,
		Type:              accountType,
		Subtype:           &accountSubType,
		Balance:           accountResp.Data.Account.Balance / 100, // Convert from kobo to naira
		Currency:          accountResp.Data.Account.Currency,
		AccountNumber:     &accountResp.Data.Account.AccountNumber,
		InstitutionName:   accountResp.Data.Account.Institution.Name,
		InstitutionID:     accountResp.Data.Account.Institution.BankCode,
		LastUpdated:       time.Now(),
		IsActive:          true,
		ProviderAccountID: accessToken,
	}

	return account, nil
}

func (m *MonoProvider) GetAccountBalance(ctx context.Context, accessToken, accountID string) (*Account, error) {
	// Same as GetAccount for Mono since balance is included in account details
	return m.GetAccount(ctx, accessToken, accountID)
}

func (m *MonoProvider) GetTransactions(ctx context.Context, accessToken, accountID string, args GetTransactionsArgs) ([]Transaction, error) {
	endpoint := fmt.Sprintf("/accounts/%s/transactions", accessToken)
	params := url.Values{}

	account, err := m.GetAccount(ctx, accessToken, accountID)
	if err != nil {
		return nil, fmt.Errorf("failed to get account info: %w", err)
	}

	if args.Count != nil {
		params.Set("limit", strconv.Itoa(*args.Count))
	}
	if args.FromID != nil {
		params.Set("from_id", *args.FromID)
	}

	if args.startDate != nil {
		params.Add("start", args.startDate.Format("2006-01-02"))
	}
	if args.endDate != nil {
		params.Add("end", args.endDate.Format("2006-01-02"))
	}

	params.Add("paginate", "false")

	if encoded := params.Encode(); encoded != "" {
		endpoint += "?" + encoded
	}

	resp, err := m.makeRequest(ctx, "GET", endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get transactions: %w", err)
	}

	var transResp monoTransactionsResponse
	if err := json.Unmarshal(resp, &transResp); err != nil {
		return nil, fmt.Errorf("failed to parse transactions response: %w", err)
	}

	// Check if the request was successful
	if transResp.Status != "successful" {
		return nil, fmt.Errorf("get transactions failed: %s", transResp.Message)
	}

	transactions := make([]Transaction, len(transResp.Data))
	for i, t := range transResp.Data {
		transaction, err := m.convertMonoTransaction(t, account)
		if err != nil {
			fmt.Printf("transaction id %s, failed to convert the transaction", t.ID)
			continue
		}

		transactions[i] = transaction
	}

	return transactions, nil
}

func (m *MonoProvider) GetRecentTransactions(ctx context.Context, accessToken, accountID string, count int) ([]Transaction, error) {
	return m.GetTransactions(ctx, accessToken, accountID, GetTransactionsArgs{Count: &count})
}

// IGNORE (Mono doesn't provide a general institutions endpoint) (might need static list)
func (m *MonoProvider) GetInstitutions(ctx context.Context) ([]Institution, error) {
	return []Institution{}, nil
}

// IGNORE (Mono doesn't provide a general institutions endpoint) (might need static list)
func (m *MonoProvider) GetInstitution(ctx context.Context, institutionID string) (*Institution, error) {
	return nil, fmt.Errorf("institution lookup not supported by Mono provider")
}

// IGNORE (Mono doesn't provide a general institutions endpoint) (might need static list)
func (m *MonoProvider) SearchInstitutions(ctx context.Context, query string) ([]Institution, error) {
	return []Institution{}, nil
}

func (m *MonoProvider) GetConnectionStatus(ctx context.Context, accessToken string) (bool, error) {
	// Try to get account details to check if connection is still valid
	_, err := m.GetAccount(ctx, accessToken, accessToken)
	return err == nil, nil
}

func (m *MonoProvider) RefreshConnection(ctx context.Context, accessToken string) error {
	// Mono connections don't need explicit refresh
	// Just verify the connection is still valid
	_, err := m.GetAccount(ctx, accessToken, accessToken)
	return err
}

func (m *MonoProvider) RemoveConnection(ctx context.Context, accessToken string) error {
	// Call Mono's unlink API
	resp, err := m.makeRequest(ctx, "POST", fmt.Sprintf("/accounts/%s/unlink", accessToken), nil)
	if err != nil {
		return fmt.Errorf("failed to unlink account: %w", err)
	}

	var unlinkResp struct {
		Status  string `json:"status"`
		Message string `json:"message"`
	}

	if err := json.Unmarshal(resp, &unlinkResp); err != nil {
		return fmt.Errorf("failed to parse unlink response: %w", err)
	}

	if unlinkResp.Status != "successful" {
		return fmt.Errorf("failed to unlink account: %s", unlinkResp.Message)
	}

	return nil
}

func (m *MonoProvider) GetProviderName() string {
	return "mono"
}

func (m *MonoProvider) GetSupportedCountries() []string {
	return []string{"NG", "GH", "KE", "ZA"} // Mono supports Nigeria, Ghana, Kenya, and South Africa
}

func (m *MonoProvider) GetSupportedAccountTypes() []AccountType {
	return []AccountType{
		AccountTypeOther,
	}
}

// Helper function to map Mono account types to standardized types
func mapMonoAccountTypeToStandard(monoType string) (AccountType, AccountSubType) {
	switch strings.ToUpper(monoType) {
	case "SAVINGS_ACCOUNT", "DIGITAL SAVINGS ACCOUNT":
		return AccountTypeCash, AccountTypeSavings
	case "CURRENT_ACCOUNT", "CHECKING_ACCOUNT", "WALLET_ACCOUNT", "CURRENT":
		return AccountTypeCash, AccountTypeChecking
	case "BUSINESS_BANKING", "BUSINESS_ACCOUNT":
		return AccountTypeInvestment, AccountSTypeInvestment
	default:
		fmt.Println("unknown mono account:", monoType)
		return AccountTypeOther, AccountSubType(AccountTypeOther)
	}
}

// makeRequest makes an HTTP request to the Mono API with proper error handling
func (m *MonoProvider) makeRequest(ctx context.Context, method, endpoint string, body any) ([]byte, error) {
	var reqBody io.Reader

	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequestWithContext(ctx, method, m.baseURL+endpoint, reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "nuts-finance/1.0")

	if m.security_key == "" {
		return nil, fmt.Errorf("secret key is required")
	}

	req.Header.Set("mono-sec-key", m.security_key)

	resp, err := m.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Handle HTTP error status codes
	if resp.StatusCode >= 400 {
		var monoErr monoErrorResponse
		if jsonErr := json.Unmarshal(respBody, &monoErr); jsonErr == nil {
			return nil, fmt.Errorf("API error %d: %s", resp.StatusCode, monoErr.Message)
		}
		return nil, fmt.Errorf("API error %d: %s", resp.StatusCode, string(respBody))
	}

	return respBody, nil
}

// convertMonoTransaction converts a Mono transaction to the standard Transaction struct
func (m *MonoProvider) convertMonoTransaction(t monoTransactionData, account *Account) (Transaction, error) {
	// Convert amount from kobo/cents to main currency unit (assuming Nigerian Naira)
	amount := float64(t.Amount) / 100.0

	// Parse the ISO timestamp
	date, err := time.Parse(time.RFC3339, t.Date)
	if err != nil {
		return Transaction{}, fmt.Errorf("failed to parse date: %w", err)
	}

	// Determine transaction type based on Mono's type field and account type
	transactionType := m.convertMonoType(t.Type)
	normalizedAmount := m.convertMonoTransactionAmount(amount, transactionType, account.Type)

	// Clean up narration for description
	description := strings.TrimSpace(t.Narration)

	return Transaction{
		ID:                    t.ID,
		AccountID:             account.ID,
		Amount:                normalizedAmount,
		Currency:              account.Currency,
		Description:           description,
		Category:              &t.Category,
		Date:                  date,
		Type:                  transactionType,
		Status:                "processed",
		ProviderTransactionID: t.ID,
		Metadata:              map[string]string{},
	}, nil
}

// determineTransactionTypeFromMono determines transaction type from Mono's type field
func (m *MonoProvider) convertMonoType(monoType string) string {
	if monoType == "debit" {
		return "expense"
	}
	return "income"
}

func (m *MonoProvider) convertMonoTransactionAmount(amount float64, transactionType string, accountType AccountType) float64 {
	var finalAmount float64

	if transactionType == "expense" {
		finalAmount = -1 * math.Abs(amount)
	} else {
		finalAmount = amount
	}

	switch accountType {
	case AccountTypeCredit:
		return -1 * finalAmount
	case AccountTypeLoan:
		return -1 * finalAmount
	default:
		return finalAmount
	}
}
