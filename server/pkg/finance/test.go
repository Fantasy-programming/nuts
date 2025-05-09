package finance

import (
	"context"
	"net/http"
)

// PaymentProcessorClient defines the interface for interacting with a payment processor API.
// It returns the raw *http.Response to allow the handler to act as a proxy.
type PaymentProcessorClient interface {
	ListAccounts(ctx context.Context, accessToken string) (*http.Response, error)
	GetAccountDetails(ctx context.Context, accessToken, accountID string) (*http.Response, error)
	GetAccountBalances(ctx context.Context, accessToken, accountID string) (*http.Response, error)
	ListAccountTransactions(ctx context.Context, accessToken, accountID string) (*http.Response, error)
	ListAccountPayees(ctx context.Context, accessToken, accountID, scheme string) (*http.Response, error)
	CreateAccountPayee(ctx context.Context, accessToken, accountID, scheme string, data interface{}) (*http.Response, error)
	CreateAccountPayment(ctx context.Context, accessToken, accountID, scheme string, data interface{}) (*http.Response, error)
}

// func main() {
// else if some_other_condition {
//    paymentClient = NewOtherProcessorClient(...)
// }

// 2. Inject the implementation (which satisfies the interface) into the handler
// accountsHandler := NewAccountsHandler(paymentClient)

// --- Routes --- (Same as before)
// r.Route("/api/accounts", func(r chi.Router) {
// 	r.Get("/", accountsHandler.HandleListAccounts)
// 	r.Route("/{account_id}", func(r chi.Router) {
// 		r.Get("/details", accountsHandler.HandleGetDetails)
// 		r.Get("/balances", accountsHandler.HandleGetBalances)
// 		r.Get("/transactions", accountsHandler.HandleGetTransactions)
// 		r.Route("/payments/{scheme}", func(r chi.Router) {
// 			r.Post("/", accountsHandler.HandlePostPayments)
// 			r.Route("/payees", func(r chi.Router) {
// 				r.Get("/", accountsHandler.HandleGetPayees)
// 				r.Post("/", accountsHandler.HandlePostPayees)
// 			})
// 		})
// 	})
// })
//

// server := &http.Server{
// 	Addr:              addr,
// 	Handler:           r,
// 	ReadHeaderTimeout: 5 * time.Second,
// 	ReadTimeout:       15 * time.Second, // Slightly increased for body read
// 	WriteTimeout:      15 * time.Second,
// 	IdleTimeout:       120 * time.Second,
// }
// }
