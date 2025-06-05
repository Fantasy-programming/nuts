package transactions

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utility/validation"
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

	return router
}
