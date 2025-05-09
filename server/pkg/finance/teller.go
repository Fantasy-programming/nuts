package finance

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

const tellerBaseURL = "https://api.teller.io"

// --- Teller Client Implementation ---

// Ensure TellerClient implements PaymentProcessorClient
var _ PaymentProcessorClient = (*TellerClient)(nil)

// TellerClient interacts with the Teller API.
type TellerClient struct {
	httpClient *http.Client
	baseURL    string
}

// NewTellerClient creates a new Teller API client.
// httpClient should be pre-configured with TLS certs if required.
func NewTellerClient(httpClient *http.Client) *TellerClient {
	if httpClient == nil {
		httpClient = &http.Client{Timeout: 30 * time.Second} // Default client
	}
	return &TellerClient{
		httpClient: httpClient,
		baseURL:    tellerBaseURL,
	}
}

// ListAccounts retrieves a list of accounts for the user.
func (c *TellerClient) ListAccounts(ctx context.Context, accessToken string) (*http.Response, error) {
	return c.request(ctx, "GET", "/accounts", accessToken, nil)
}

// GetAccountDetails retrieves details for a specific account.
func (c *TellerClient) GetAccountDetails(ctx context.Context, accessToken, accountID string) (*http.Response, error) {
	path := fmt.Sprintf("/accounts/%s/details", url.PathEscape(accountID))
	return c.request(ctx, "GET", path, accessToken, nil)
}

// GetAccountBalances retrieves balances for a specific account.
func (c *TellerClient) GetAccountBalances(ctx context.Context, accessToken, accountID string) (*http.Response, error) {
	path := fmt.Sprintf("/accounts/%s/balances", url.PathEscape(accountID))
	return c.request(ctx, "GET", path, accessToken, nil)
}

// ListAccountTransactions retrieves transactions for a specific account.
func (c *TellerClient) ListAccountTransactions(ctx context.Context, accessToken, accountID string) (*http.Response, error) {
	path := fmt.Sprintf("/accounts/%s/transactions", url.PathEscape(accountID))
	return c.request(ctx, "GET", path, accessToken, nil)
}

// ListAccountPayees retrieves payees for a specific account and scheme.
func (c *TellerClient) ListAccountPayees(ctx context.Context, accessToken, accountID, scheme string) (*http.Response, error) {
	path := fmt.Sprintf("/accounts/%s/payments/%s/payees", url.PathEscape(accountID), url.PathEscape(scheme))
	return c.request(ctx, "GET", path, accessToken, nil)
}

// CreateAccountPayee creates a payee for a specific account and scheme.
// data should be a struct or map that can be marshalled to JSON.
func (c *TellerClient) CreateAccountPayee(ctx context.Context, accessToken, accountID, scheme string, data interface{}) (*http.Response, error) {
	path := fmt.Sprintf("/accounts/%s/payments/%s/payees", url.PathEscape(accountID), url.PathEscape(scheme))
	return c.request(ctx, "POST", path, accessToken, data)
}

// CreateAccountPayment creates a payment for a specific account and scheme.
// data should be a struct or map that can be marshalled to JSON.
func (c *TellerClient) CreateAccountPayment(ctx context.Context, accessToken, accountID, scheme string, data interface{}) (*http.Response, error) {
	path := fmt.Sprintf("/accounts/%s/payments/%s", url.PathEscape(accountID), url.PathEscape(scheme))
	return c.request(ctx, "POST", path, accessToken, data)
}

// request makes an HTTP request to the Teller API.
// Caller is responsible for closing the response body if the error is nil.
func (c *TellerClient) request(ctx context.Context, method, path, accessToken string, data interface{}) (*http.Response, error) {
	fullURL := c.baseURL + path

	var bodyReader io.Reader

	if data != nil {
		jsonData, err := json.Marshal(data)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request data: %w", err)
		}
		bodyReader = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequestWithContext(ctx, method, fullURL, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.SetBasicAuth(accessToken, "") // Teller uses the access token as the username
	if data != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		// Check for context cancellation/deadline exceeded before wrapping
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
			return nil, err // Return context error directly
		}
		// Check for URL error (e.g., DNS lookup failure, connection refused)
		var urlErr *url.Error
		if errors.As(err, &urlErr) {
			return nil, fmt.Errorf("network error contacting %s: %w", urlErr.URL, err)
		}
		// Generic request execution error
		return nil, fmt.Errorf("failed to execute request to %s: %w", fullURL, err)
	}

	// Don't handle status codes here, let the handler do it.
	// Just return the response or an execution error.

	return resp, nil
}

// AccountsHandler handles incoming API requests and proxies them to a PaymentProcessorClient.
type AccountsHandler struct {
	// Use the interface type here
	client PaymentProcessorClient
}

// NewAccountsHandler creates a new handler with a specific PaymentProcessorClient implementation.
func NewAccountsHandler(client PaymentProcessorClient) *AccountsHandler {
	return &AccountsHandler{client: client}
}

// Helper to proxy the request and write the response (remains the same logic, uses interface methods)
func (h *AccountsHandler) proxyRequest(w http.ResponseWriter, r *http.Request, processorCall func(ctx context.Context, token string) (*http.Response, error)) {
	token, err := getBearerToken(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Call the function which will use the interface method
	processorResp, err := processorCall(r.Context(), token)
	if err != nil {
		log.Printf("Error calling payment processor API: %v", err)
		// Check for specific context errors for better client feedback
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Gateway Timeout", http.StatusGatewayTimeout)
		} else if errors.Is(err, context.Canceled) {
			// Client likely disconnected
			// Consider just logging or a specific code like 499 Client Closed Request (Nginx specific)
			log.Printf("Client request cancelled: %v", err)
		} else {
			http.Error(w, "Internal Server Error communicating with payment processor", http.StatusBadGateway) // 502 might be more appropriate
		}
		return
	}
	defer processorResp.Body.Close()

	// Copy headers from processor response to our response
	for key, values := range processorResp.Header {
		if strings.EqualFold(key, "Content-Type") || strings.EqualFold(key, "Content-Length") {
			for _, value := range values {
				w.Header().Add(key, value)
			}
		}
	}

	// Write the status code from processor's response
	w.WriteHeader(processorResp.StatusCode)

	// Copy the body from processor's response
	if _, err := io.Copy(w, processorResp.Body); err != nil {
		log.Printf("Error copying response body: %v", err)
	}
}

// Helper to proxy POST requests (remains the same logic, uses interface methods)
func (h *AccountsHandler) proxyPostRequest(w http.ResponseWriter, r *http.Request, processorCall func(ctx context.Context, token string, data map[string]interface{}) (*http.Response, error)) {
	token, err := getBearerToken(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Decode JSON body from incoming request
	var requestData map[string]interface{} // Use map for generic JSON
	if r.Body != nil && r.ContentLength > 0 {
		// Limit request body size
		maxRequestSize := int64(1 << 20) // 1 MB limit
		r.Body = http.MaxBytesReader(w, r.Body, maxRequestSize)

		decoder := json.NewDecoder(r.Body)
		decoder.DisallowUnknownFields()
		if err := decoder.Decode(&requestData); err != nil {
			var syntaxError *json.SyntaxError
			var unmarshalTypeError *json.UnmarshalTypeError
			var maxBytesError *http.MaxBytesError

			switch {
			case errors.As(err, &syntaxError):
				msg := fmt.Sprintf("Request body contains badly-formed JSON (at character %d)", syntaxError.Offset)
				http.Error(w, msg, http.StatusBadRequest)
			case errors.Is(err, io.ErrUnexpectedEOF):
				msg := "Request body contains badly-formed JSON"
				http.Error(w, msg, http.StatusBadRequest)
			case errors.As(err, &unmarshalTypeError):
				msg := fmt.Sprintf("Request body contains an invalid value for the %q field (at character %d)", unmarshalTypeError.Field, unmarshalTypeError.Offset)
				http.Error(w, msg, http.StatusBadRequest)
			case errors.Is(err, io.EOF):
				// Allow empty body if needed by API? Or return error?
				// For now, let's treat empty body as potentially valid if ContentLength > 0 but Decode gets EOF
				// But if ContentLength was 0, requestData will be nil anyway.
				// Consider erroring: http.Error(w, "Request body must not be empty", http.StatusBadRequest)
				requestData = nil // Ensure it's nil if body was just whitespace or empty braces
			case errors.As(err, &maxBytesError):
				msg := fmt.Sprintf("Request body must not be larger than %d bytes", maxBytesError.Limit)
				http.Error(w, msg, http.StatusRequestEntityTooLarge)
			default:
				log.Printf("Error decoding request body: %v", err)
				http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest) // Generic bad request
			}
			return
		}
		// Check if there is anything else in the body after decoding the JSON.
		if err := decoder.Decode(&struct{}{}); err != io.EOF {
			msg := "Request body must only contain a single JSON object"
			http.Error(w, msg, http.StatusBadRequest)
			return
		}

	}
	// It's crucial to close the request body *after* processing it.
	if r.Body != nil {
		defer r.Body.Close()
	}

	// Call the function which will use the interface method
	processorResp, err := processorCall(r.Context(), token, requestData)
	if err != nil {
		log.Printf("Error calling payment processor API: %v", err)
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Gateway Timeout", http.StatusGatewayTimeout)
		} else if errors.Is(err, context.Canceled) {
			log.Printf("Client request cancelled: %v", err)
		} else {
			http.Error(w, "Internal Server Error communicating with payment processor", http.StatusBadGateway) // 502 might be more appropriate
		}
		return
	}
	defer processorResp.Body.Close()

	// Copy headers
	for key, values := range processorResp.Header {
		if strings.EqualFold(key, "Content-Type") || strings.EqualFold(key, "Content-Length") {
			for _, value := range values {
				w.Header().Add(key, value)
			}
		}
	}
	// Write status code
	w.WriteHeader(processorResp.StatusCode)
	// Copy body
	if _, err := io.Copy(w, processorResp.Body); err != nil {
		log.Printf("Error copying response body: %v", err)
	}
}

// Helper to extract bearer token (remains the same)
func getBearerToken(r *http.Request) (string, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return "", errors.New("missing Authorization header")
	}
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", errors.New("invalid Authorization header format")
	}
	return parts[1], nil
}

// --- Route Handlers (Unchanged Internally, Call Interface Methods) ---

func (h *AccountsHandler) HandleListAccounts(w http.ResponseWriter, r *http.Request) {
	h.proxyRequest(w, r, func(ctx context.Context, token string) (*http.Response, error) {
		// This now calls the interface method
		return h.client.ListAccounts(ctx, token)
	})
}

func (h *AccountsHandler) HandleGetDetails(w http.ResponseWriter, r *http.Request) {
	accountID := chi.URLParam(r, "account_id")
	h.proxyRequest(w, r, func(ctx context.Context, token string) (*http.Response, error) {
		// This now calls the interface method
		return h.client.GetAccountDetails(ctx, token, accountID)
	})
}

func (h *AccountsHandler) HandleGetBalances(w http.ResponseWriter, r *http.Request) {
	accountID := chi.URLParam(r, "account_id")
	h.proxyRequest(w, r, func(ctx context.Context, token string) (*http.Response, error) {
		// This now calls the interface method
		return h.client.GetAccountBalances(ctx, token, accountID)
	})
}

func (h *AccountsHandler) HandleGetTransactions(w http.ResponseWriter, r *http.Request) {
	accountID := chi.URLParam(r, "account_id")
	h.proxyRequest(w, r, func(ctx context.Context, token string) (*http.Response, error) {
		// This now calls the interface method
		return h.client.ListAccountTransactions(ctx, token, accountID)
	})
}

func (h *AccountsHandler) HandleGetPayees(w http.ResponseWriter, r *http.Request) {
	accountID := chi.URLParam(r, "account_id")
	scheme := chi.URLParam(r, "scheme")
	h.proxyRequest(w, r, func(ctx context.Context, token string) (*http.Response, error) {
		// This now calls the interface method
		return h.client.ListAccountPayees(ctx, token, accountID, scheme)
	})
}

func (h *AccountsHandler) HandlePostPayees(w http.ResponseWriter, r *http.Request) {
	accountID := chi.URLParam(r, "account_id")
	scheme := chi.URLParam(r, "scheme")
	h.proxyPostRequest(w, r, func(ctx context.Context, token string, data map[string]interface{}) (*http.Response, error) {
		// This now calls the interface method
		return h.client.CreateAccountPayee(ctx, token, accountID, scheme, data)
	})
}

func (h *AccountsHandler) HandlePostPayments(w http.ResponseWriter, r *http.Request) {
	accountID := chi.URLParam(r, "account_id")
	scheme := chi.URLParam(r, "scheme")
	h.proxyPostRequest(w, r, func(ctx context.Context, token string, data map[string]interface{}) (*http.Response, error) {
		// This now calls the interface method
		return h.client.CreateAccountPayment(ctx, token, accountID, scheme, data)
	})
}
