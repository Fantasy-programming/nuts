package webhooks

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

type Webhooks struct {
	queries *repository.Queries
	v       *validation.Validator
	tkn     *jwt.TokenService
	log     *zerolog.Logger
}

func Init(db *pgxpool.Pool, validate *validation.Validator, tkn *jwt.TokenService, logger *zerolog.Logger) *Webhooks {
	queries := repository.New(db)
	return &Webhooks{queries, validate, tkn, logger}
}

func (w *Webhooks) Register() http.Handler {
	router := router.NewRouter()
	router.Use(w.tkn.Verify)
	router.Get("/", w.GetWebhooks)
	router.Post("/", w.CreateWebhook)
	router.Get("/{id}", w.GetWebhook)
	router.Put("/{id}", w.UpdateWebhook)
	router.Delete("/{id}", w.DeleteWebhook)
	router.Post("/{id}/test", w.TestWebhook)

	return router
}
