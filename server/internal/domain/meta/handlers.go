package meta

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

type Meta struct {
	queries *repository.Queries
	log     *zerolog.Logger
}

func Init(db *pgxpool.Pool, logger *zerolog.Logger) *Meta {
	queries := repository.New(db)
	return &Meta{queries, logger}
}

func (m *Meta) Register() http.Handler {
	router := router.NewRouter()
	router.Get("/currencies", m.GetSupportedCurrencies)
	router.Get("/lang", m.GetSupportedLanguages)

	return router
}
