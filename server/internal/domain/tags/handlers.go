package tags

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

type Tags struct {
	queries *repository.Queries
	v       *validation.Validator
	tkn     *jwt.TokenService
	log     *zerolog.Logger
}

func Init(db *pgxpool.Pool, validate *validation.Validator, tkn *jwt.TokenService, logger *zerolog.Logger) *Tags {
	queries := repository.New(db)
	return &Tags{queries, validate, tkn, logger}
}

func (t *Tags) Register() http.Handler {
	router := router.NewRouter()
	router.Use(t.tkn.Verify)
	router.Get("/", t.GetTags)
	router.Post("/", t.CreateTag)
	router.Put("/{id}", t.UpdateTag)
	router.Delete("/{id}", t.DeleteTag)

	return router
}
