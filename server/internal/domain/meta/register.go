package meta

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

func RegisterHTTPHandlers(db *pgxpool.Pool, logger *zerolog.Logger) http.Handler {
	queries := repository.New(db)
	repo := NewRepository(queries)
	h := NewHandler(repo, logger)

	router := router.NewRouter()
	router.Get("/currencies", h.GetSupportedCurrencies)
	router.Get("/lang", h.GetSupportedLanguages)

	return router
}
