package user

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

type User struct {
	queries  *repository.Queries
	config   *config.Config
	log      *zerolog.Logger
	validate *validation.Validator
}

func Init(db *pgxpool.Pool, config *config.Config, validate *validation.Validator, logger *zerolog.Logger) *User {
	queries := repository.New(db)
	return &User{queries, config, logger, validate}
}

func (u *User) Register() http.Handler {
	router := router.NewRouter()
	router.Use(jwtauth.Verifier(u.config.SigningKey))
	router.Use(jwtauth.Authenticator(u.config.SigningKey))
	router.Get("/me", u.GetInfo)
	router.Put("/me", u.UpdateInfo)
	router.Delete("/me", u.DeleteInfo)
	return router
}
