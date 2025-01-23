package accounts

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/config"
	"github.com/Fantasy-Programming/nuts/internal/middleware/jwtauth"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/lib/validation"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Account struct {
	queries  *repository.Queries
	config   *config.Config
	validate *validation.Validator
}

func Init(db *pgxpool.Pool, config *config.Config, validate *validation.Validator) *Account {
	queries := repository.New(db)
	return &Account{queries, config, validate}
}

func (a *Account) Register() http.Handler {
	router := router.NewRouter()
	router.Use(jwtauth.Verifier(a.config.SigningKey))
	router.Use(jwtauth.Authenticator(a.config.SigningKey))
	router.Get("/", a.GetAccounts)
	router.Post("/", a.CreateAccount)
	router.Get("/{id}", a.GetAccount)
	router.Put("/{id}", a.UpdateAccount)
	router.Delete("/{id}", a.DeleteAccount)

	a.registerValidations()
	return router
}
