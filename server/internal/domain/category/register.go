package category

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/config"
	"github.com/Fantasy-Programming/nuts/internal/middleware/jwtauth"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

type Category struct {
	queries  *repository.Queries
	config   *config.Config
	log      *zerolog.Logger
	validate *validation.Validator
}

func Init(db *pgxpool.Pool, config *config.Config, validate *validation.Validator, logger *zerolog.Logger) *Category {
	queries := repository.New(db)
	return &Category{queries, config, logger, validate}
}

func (c *Category) Register() http.Handler {
	router := router.NewRouter()
	router.Use(jwtauth.Verifier(c.config.SigningKey))
	router.Use(jwtauth.Authenticator(c.config.SigningKey))
	router.Get("/", c.GetCategories)
	router.Post("/", c.CreateCategories)
	router.Put("/{id}", c.UpdateCategory)
	router.Delete("/{id}", c.DeleteCategory)

	return router
}
