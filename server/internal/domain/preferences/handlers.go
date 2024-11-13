package preferences

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/jackc/pgx/v5"
)

type Preferences struct {
	queries *repository.Queries
}

func Init(db *pgx.Conn) *Preferences {
	queries := repository.New(db)
	return &Preferences{queries}
}

func (c *Preferences) Register() http.Handler {
	router := router.NewRouter()
	router.Get("/", c.GetPreferences)
	router.Put("/", c.UpdatePreferences)

	return router
}
