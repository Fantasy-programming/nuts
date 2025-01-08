package category

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/config"
	"github.com/Fantasy-Programming/nuts/internal/middleware/jwtauth"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Category struct {
	queries *repository.Queries
	config  *config.Config
}

func Init(db *pgxpool.Pool, config *config.Config) *Category {
	queries := repository.New(db)
	return &Category{queries, config}
}

func (c *Category) Register() http.Handler {
	router := router.NewRouter()
	router.Use(jwtauth.Verifier(c.config.SigningKey))
	router.Use(jwtauth.Authenticator())
	router.Get("/", c.GetCategories)
	router.Post("/", c.CreateCategories)
	router.Put("/{id}", c.UpdateCategory)
	router.Delete("/{id}", c.DeleteCategory)

	return router
}
