package webhooks

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
	repo := NewRepository(queries)
	h := NewHandler(validate, repo, logger)

	// Create the auth verify middleware
	middleware := jwt.NewMiddleware(tkn)

	router := router.NewRouter()
	router.Use(middleware.Verify)
	router.Get("/", h.GetWebhooks)
	router.Post("/", h.CreateWebhook)
	router.Get("/{id}", h.GetWebhook)
	router.Put("/{id}", h.UpdateWebhook)
	router.Delete("/{id}", h.DeleteWebhook)
	router.Post("/{id}/test", h.TestWebhook)

	return router
}
