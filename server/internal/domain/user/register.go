package user

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/config"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/Fantasy-Programming/nuts/pkg/storage"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

func RegisterHTTPHandlers(cfg *config.Config, db *pgxpool.Pool, storage storage.Storage, validate *validation.Validator, tkn *jwt.Service, logger *zerolog.Logger) http.Handler {
	queries := repository.New(db)
	repo := NewRepository(db, queries, storage)
	h := NewHandler(cfg, validate, repo, storage, logger)

	// Create the auth verify middleware
	middleware := jwt.NewMiddleware(tkn)

	router := router.NewRouter()
	router.Use(middleware.Verify)
	router.Get("/me", h.GetInfo)
	router.Put("/me", h.UpdateInfo)
	router.Delete("/me", h.DeleteInfo)

	// Avatar endpoint
	router.Put("/me/avatar", h.UploadAvatar)

	return router
}
