package handlers

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/transactions/service"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/router"
	"github.com/rs/zerolog"
)

func RegisterHTTPHandlers(service service.Transactions, tkn *jwt.Service, validator *validation.Validator, logger *zerolog.Logger) http.Handler {
	h := NewHandler(service, validator, logger)

	middleware := jwt.NewMiddleware(tkn)

	router := router.NewRouter()
	router.Use(middleware.Verify)

	// Base operations
	router.Get("/", h.List)
	router.Post("/", h.Create)
	router.Post("/transfer", h.CreateTransfert)
	router.Get("/{id}", h.Get)
	router.Put("/{id}", h.Update)
	router.Delete("/{id}", h.Delete)

	// Bulk operations
	router.Post("/bulk", h.BulkCreateTransactions)
	router.Delete("/bulk", h.BulkDelete)
	router.Put("/bulk/categories", h.BulkUpdateCategories)
	router.Put("/bulk/manual", h.BulkUpdateManualTransactions)

	// Rules
	router.Post("/rules", h.CreateRule)                         // POST /rules
	router.Get("/rules", h.ListRules)                           // GET /rules
	router.Get("/rules/{id}", h.GetRule)                        // GET /rules/{id}
	router.Put("/rules/{id}", h.UpdateRule)                     // PUT /rules/{id}
	router.Delete("/rules/{id}", h.DeleteRule)                  // DELETE /rules/{id}
	router.Post("/rules/toggle/{id}", h.ToggleRule)             // POST /rules/{id}/toggle
	router.Post("/rules/apply/{id}", h.ApplyRulesToTransaction) // POST /rules/apply/{transactionId}

	// ai
	router.Post("/neural-input", h.ParseTransactions)

	return router
}
