package category

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/jackc/pgx/v5"
)

type Category struct {
	queries *repository.Queries
}

func Init(db *pgx.Conn) *Category {
	queries := repository.New(db)
	return &Category{queries}
}

func (c *Category) Register() http.Handler {
	router := router.NewRouter()
	router.Get("/", c.GetCategories)
	router.Post("/", c.CreateCategories)
	router.Put("/{id}", c.UpdateCategory)
	router.Delete("/{id}", c.DeleteCategory)

	return router
}
