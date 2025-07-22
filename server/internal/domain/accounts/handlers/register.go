package handlers

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/accounts/service"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/router"
	"github.com/rs/zerolog"
)

func RegisterHTTPHandlers(service service.Account, validator *validation.Validator, tkn *jwt.Service, logger *zerolog.Logger) http.Handler {
	h := NewHandler(service, validator, logger)

	middleware := jwt.NewMiddleware(tkn)
	router := router.NewRouter()
	router.Use(middleware.Verify)

	router.Get("/", h.List)
	router.Get("/{id}", h.Get)
	router.Post("/", h.Create)
	router.Put("/{id}", h.Update)
	router.Delete("/{id}", h.Delete)

	// Bank Connections
	// router.Get("/institutions", h.SearchInstitutions)
	// router.Get("/institutions/{id}", h.GetInstitution)

	// Connection management
	// router.Post("/connections", h.CreateConnection)
	// router.Get("/connections", h.GetConnections)
	// router.Put("/connections/{id}/reconnect", h.ReconnectConnection)
	// router.Delete("/connections/{id}", h.DeleteConnection)

	// Account management
	// router.Get("/connections/{id}/accounts", h.GetConnectionAccounts)
	// router.Post("/connections/{id}/sync", h.SyncTransactions)
	// protectedRoutes.HandleFunc("/plaid/items", handlers.GetPlaidItems).Methods("GET") // New endpoint
	// protectedRoutes.HandleFunc("/plaid/sync", handlers.SyncPlaidData).Methods("POST") // New endpoint

	// Provider-specific endpoints
	// router.Post("/plaid/link-token", h.CreatePlaidLinkToken)
	// router.Post("/plaid/exchange-token", h.ExchangePlaidToken)
	router.Post("/teller/connect", h.TellerConnect)
	// router.Post("/plaid/connect", h.PlaidConnect)
	router.Post("/mono/connect", h.MonoConnect)
	// router.Post("/mono/webhook", h.MonoConnect)

	// router.Post("/plaid/create_link_token", handlers.CreateLinkToken)
	// router.Post("/plaid/exchange_public_token", handlers.ExchangePublicToken)
	// router.Post("/plaid/webhook", handlers.HandlePlaidWebhook)

	// Complex queries
	router.Get("/timeline", h.ListBalanceTimelines)
	router.Get("/trends", h.GetTrends)
	router.Get("/timeline/{id}", h.GetBalanceTimeline)

	return router
}
