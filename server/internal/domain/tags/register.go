package tags

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/router"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

func RegisterHTTPHandlers(db *pgxpool.Pool, validator *validation.Validator, logger *zerolog.Logger) http.Handler {
	queries := repository.New(db)
	repo := NewRepository(queries)
	h := NewHandler(validator, repo, logger)

	router := router.NewRouter()
	router.Get("/", h.GetTags)
	router.Post("/", h.CreateTag)
	router.Put("/{id}", h.UpdateTag)
	router.Delete("/{id}", h.DeleteTag)

	return router
}
