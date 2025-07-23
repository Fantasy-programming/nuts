package transactions

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/router"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

func RegisterHTTPHandlers(db *pgxpool.Pool, validate *validation.Validator, tkn *jwt.Service, logger *zerolog.Logger) http.Handler {
	queries := repository.New(db)
	repo := NewRepository(db, queries)
	h := NewHandler(validate, repo, logger)

	// Create the auth verify middleware
	middleware := jwt.NewMiddleware(tkn)

	router := router.NewRouter()
	router.Use(middleware.Verify)
	router.Get("/", h.GetTransactions)
	router.Post("/", h.CreateTransaction)
	router.Post("/transfert", h.CreateTransfert)
	router.Get("/{id}", h.GetTransaction)
	router.Put("/{id}", h.UpdateTransaction)
	router.Delete("/{id}", h.DeleteTransaction)
	
	// Bulk operations
	router.Delete("/", h.BulkDeleteTransactions)
	router.Put("/bulk/categories", h.BulkUpdateCategories)
	router.Put("/bulk/manual", h.BulkUpdateManualTransactions)
	router.Post("/bulk", h.BulkCreateTransactions)

	// protectedRoutes.HandleFunc("/recurring_transactions", handlers.CreateRecurringTransaction).Methods("POST")
	// protectedRoutes.HandleFunc("/recurring_transactions", handlers.GetRecurringTransactions).Methods("GET")
	// // (Add Update/Delete recurring transactions as needed)
	// protectedRoutes.HandleFunc("/recurring_transactions/generate_pending", handlers.GeneratePendingRecurringTransactions).Methods("POST")
	// protectedRoutes.HandleFunc("/transactions/automated_import", handlers.AutomatedImportTransaction).Methods("POST")
	return router
}

// RegisterHTTPHandlersWithRules is a version that accepts rules service
func RegisterHTTPHandlersWithRules(db *pgxpool.Pool, validate *validation.Validator, tkn *jwt.Service, rulesService RulesService, logger *zerolog.Logger) http.Handler {
	queries := repository.New(db)
	repo := NewRepository(db, queries)
	h := NewHandlerWithRules(validate, repo, rulesService, logger)

	// Create the auth verify middleware
	middleware := jwt.NewMiddleware(tkn)

	router := router.NewRouter()
	router.Use(middleware.Verify)
	router.Get("/", h.GetTransactions)
	router.Post("/", h.CreateTransaction)
	router.Post("/transfert", h.CreateTransfert)
	router.Get("/{id}", h.GetTransaction)
	router.Put("/{id}", h.UpdateTransaction)
	router.Delete("/{id}", h.DeleteTransaction)
	
	// Bulk operations
	router.Delete("/", h.BulkDeleteTransactions)
	router.Put("/bulk/categories", h.BulkUpdateCategories)
	router.Put("/bulk/manual", h.BulkUpdateManualTransactions)
	router.Post("/bulk", h.BulkCreateTransactions)

	// protectedRoutes.HandleFunc("/recurring_transactions", handlers.CreateRecurringTransaction).Methods("POST")
	// protectedRoutes.HandleFunc("/recurring_transactions", handlers.GetRecurringTransactions).Methods("GET")
	// // (Add Update/Delete recurring transactions as needed)
	// protectedRoutes.HandleFunc("/recurring_transactions/generate_pending", handlers.GeneratePendingRecurringTransactions).Methods("POST")
	// protectedRoutes.HandleFunc("/transactions/automated_import", handlers.AutomatedImportTransaction).Methods("POST")
	return router
}
