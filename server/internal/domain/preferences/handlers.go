package preferences

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/config"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

type Preferences struct {
	queries  *repository.Queries
	validate *validation.Validator
	config   *config.Config
	log      *zerolog.Logger
}

func Init(db *pgxpool.Pool, config *config.Config, validate *validation.Validator, logger *zerolog.Logger) *Preferences {
	queries := repository.New(db)
	return &Preferences{queries, validate, config, logger}
}

func (c *Preferences) Register() http.Handler {
	router := router.NewRouter()
	router.Get("/", c.GetPreferences)
	router.Put("/", c.UpdatePreferences)

	return router
}
