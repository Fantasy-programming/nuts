package tags

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

type Tags struct {
	queries *repository.Queries
	v       *validation.Validator
	log     *zerolog.Logger
}

func Init(db *pgxpool.Pool, validate *validation.Validator, logger *zerolog.Logger) *Tags {
	queries := repository.New(db)
	return &Tags{queries, validate, logger}
}

func (c *Tags) Register() http.Handler {
	router := router.NewRouter()
	router.Get("/", c.GetTags)
	router.Post("/", c.CreateTags)
	router.Put("/", c.UpdateTags)
	router.Delete("/", c.DeleteTags)

	return router
}
