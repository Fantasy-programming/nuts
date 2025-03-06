package category

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/config"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

type Category struct {
	queries  *repository.Queries
	config   *config.Config
	tkn      *jwt.TokenService
	validate *validation.Validator
	log      *zerolog.Logger
}

func Init(db *pgxpool.Pool, config *config.Config, tkn *jwt.TokenService, validate *validation.Validator, logger *zerolog.Logger) *Category {
	queries := repository.New(db)
	return &Category{queries, config, tkn, validate, logger}
}

func (c *Category) Register() http.Handler {
	router := router.NewRouter()
	router.Use(c.tkn.Verify)
	router.Get("/", c.GetCategories)
	router.Post("/", c.CreateCategories)
	router.Put("/{id}", c.UpdateCategory)
	router.Delete("/{id}", c.DeleteCategory)

	return router
}
