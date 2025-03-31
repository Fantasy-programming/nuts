package accounts

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

func RegisterHTTPHandlers(db *pgxpool.Pool, validate *validation.Validator, tkn *jwt.Service, logger *zerolog.Logger) http.Handler {
	queries := repository.New(db)
	repo := NewRepository(queries, db)
	h := NewHandler(validate, db, repo, logger)

	// Create the auth verify middleware
	middleware := jwt.NewMiddleware(tkn)

	router := router.NewRouter()
	router.Use(middleware.Verify)
	router.Get("/", h.GetAccounts)
	router.Get("/{id}", h.GetAccount)
	router.Post("/", h.CreateAccount)
	router.Put("/{id}", h.UpdateAccount)
	router.Delete("/{id}", h.DeleteAccount)

	// Complex queries
	router.Get("/timeline", h.GetAccountsBTimeline)
	router.Get("/trends", h.GetAccountsTrends)
	router.Get("/timeline/{id}", h.GetAccountBTimeline)

	return router
}
