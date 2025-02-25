package auth

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/config"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/i18n"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

type Auth struct {
	db      *pgxpool.Pool
	queries *repository.Queries
	config  *config.Config
	v       *validation.Validator
	i18n    *i18n.I18n
	log     *zerolog.Logger
}

func Init(db *pgxpool.Pool, config *config.Config, validate *validation.Validator, i18n *i18n.I18n, logger *zerolog.Logger) *Auth {
	queries := repository.New(db)
	return &Auth{db, queries, config, validate, i18n, logger}
}

func (a *Auth) Register() http.Handler {
	router := router.NewRouter()
	router.Post("/login", a.Login)
	router.Post("/signup", a.Signup)
	router.Post("/logout", a.Logout)

	a.registerValidations()
	a.log.Info().Msg("Auth routes registered")
	return router
}
