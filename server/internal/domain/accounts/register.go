package accounts

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/finance"
	"github.com/Fantasy-Programming/nuts/server/pkg/jobs"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/router"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

func RegisterHTTPHandlers(db *pgxpool.Pool, validate *validation.Validator, tkn *jwt.Service, openFinanceManager *finance.ProviderManager, scheduler *jobs.Service, logger *zerolog.Logger) http.Handler {
	queries := repository.New(db)
	repo := NewRepository(queries, db)
	h := NewHandler(validate, db, repo, openFinanceManager, scheduler, logger)

	// Create the auth verify middleware
	middleware := jwt.NewMiddleware(tkn)

	router := router.NewRouter()
	router.Use(middleware.Verify)
	router.Get("/", h.GetAccounts)
	router.Get("/{id}", h.GetAccount)
	router.Post("/", h.CreateAccount)
	router.Put("/{id}", h.UpdateAccount)
	router.Delete("/{id}", h.DeleteAccount)

	// Bank Connections
	// router.Get("/institutions", h.SearchInstitutions)
	//  router.Get("/institutions/{id}", h.GetInstitution)

	// Connection management
	// router.Post("/connections", h.CreateConnection)
	// router.Get("/connections", h.GetConnections)
	// router.Put("/connections/{id}/reconnect", h.ReconnectConnection)
	// router.Delete("/connections/{id}", h.DeleteConnection)

	// Account management
	// router.Get("/connections/{id}/accounts", h.GetConnectionAccounts)
	// router.Post("/connections/{id}/sync", h.SyncTransactions)

	// Provider-specific endpoints
	// router.Post("/plaid/link-token", h.CreatePlaidLinkToken)
	// router.Post("/plaid/exchange-token", h.ExchangePlaidToken)
	router.Post("/teller/connect", h.TellerConnect)
	router.Post("/mono/connect", h.MonoConnect)

	// Complex queries
	router.Get("/timeline", h.GetAccountsBTimeline)
	router.Get("/trends", h.GetAccountsTrends)
	router.Get("/timeline/{id}", h.GetAccountBTimeline)

	return router
}
