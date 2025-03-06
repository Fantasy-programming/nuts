package accounts

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

type Account struct {
	queries *repository.Queries
	config  *config.Config
	v       *validation.Validator
	tkn     *jwt.TokenService
	log     *zerolog.Logger
}

func Init(db *pgxpool.Pool, config *config.Config, validate *validation.Validator, tkn *jwt.TokenService, logger *zerolog.Logger) *Account {
	queries := repository.New(db)
	return &Account{queries, config, validate, tkn, logger}
}

func (a *Account) Register() http.Handler {
	router := router.NewRouter()
	router.Use(a.tkn.Verify)
	router.Get("/", a.GetAccounts)
	router.Post("/", a.CreateAccount)
	router.Get("/{id}", a.GetAccount)
	router.Put("/{id}", a.UpdateAccount)
	router.Delete("/{id}", a.DeleteAccount)
	return router
}
