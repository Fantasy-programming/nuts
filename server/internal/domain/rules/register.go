package rules

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/transactions"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/router"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

// RegisterHTTPHandlers registers the HTTP handlers for rules
func RegisterHTTPHandlers(db *pgxpool.Pool, validate *validation.Validator, tkn *jwt.Service, transRepo transactions.Repository, logger *zerolog.Logger) http.Handler {
	// Create repositories and services
	repo := NewRepository(db)
	service := NewService(repo, transRepo, logger)
	handler := NewHandler(service, validate, logger)

	// Create the auth verify middleware
	middleware := jwt.NewMiddleware(tkn)

	// Create router
	router := router.NewRouter()
	router.Use(middleware.Verify)

	// Register routes
	router.Post("/", handler.CreateRule)               // POST /rules
	router.Get("/", handler.ListRules)                 // GET /rules
	router.Get("/{id}", handler.GetRule)               // GET /rules/{id}
	router.Put("/{id}", handler.UpdateRule)            // PUT /rules/{id}
	router.Delete("/{id}", handler.DeleteRule)         // DELETE /rules/{id}
	router.Post("/{id}/toggle", handler.ToggleRule)    // POST /rules/{id}/toggle
	router.Post("/apply/{transactionId}", handler.ApplyRulesToTransaction) // POST /rules/apply/{transactionId}

	return router
}