package auth

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/config"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/lib/validation"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Auth struct {
	queries  *repository.Queries
	config   *config.Config
	validate *validation.Validator
}

func Init(db *pgxpool.Pool, config *config.Config, validate *validation.Validator) *Auth {
	queries := repository.New(db)
	return &Auth{queries, config, validate}
}

func (a *Auth) Register() http.Handler {
	router := router.NewRouter()
	router.Post("/login", a.Login)
	router.Post("/signup", a.Signup)
	router.Post("/logout", a.Logout)

	// setup validation
	a.registerValidations()
	return router
}
