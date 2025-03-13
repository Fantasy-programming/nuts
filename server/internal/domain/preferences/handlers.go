package preferences

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

type Preferences struct {
	queries  *repository.Queries
	validate *validation.Validator
	config   *config.Config
	tkn      *jwt.TokenService
	log      *zerolog.Logger
}

func Init(db *pgxpool.Pool, config *config.Config, validate *validation.Validator, tkn *jwt.TokenService, logger *zerolog.Logger) *Preferences {
	queries := repository.New(db)
	return &Preferences{queries, validate, config, tkn, logger}
}

func (c *Preferences) Register() http.Handler {
	router := router.NewRouter()
	router.Use(c.tkn.Verify)
	router.Get("/", c.GetPreferences)
	router.Put("/", c.UpdatePreferences)

	return router
}
