package tags

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/jackc/pgx/v5"
)

type Tags struct {
	queries *repository.Queries
}

func Init(db *pgx.Conn) *Tags {
	queries := repository.New(db)
	return &Tags{queries}
}

func (c *Tags) Register() http.Handler {
	router := router.NewRouter()
	router.Get("/", c.GetTags)
	router.Post("/", c.CreateTags)
	router.Put("/", c.UpdateTags)
	router.Delete("/", c.DeleteTags)

	return router
}
