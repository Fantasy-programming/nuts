package auth

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
	repo := NewRepository(db, queries)
	h := NewHandler(validate, tkn, repo, logger)

	router := router.NewRouter()
	router.Post("/login", h.Login)
	router.Post("/signup", h.Signup)
	router.Post("/logout", h.Logout)
	router.Post("/refresh", h.Refresh)

	// Register validator
	RegisterValidations(validate.Validator)

	return router
}
