package accounts

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/config"
	"github.com/Fantasy-Programming/nuts/internal/middleware/jwtauth"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/jackc/pgx/v5"
)

type Account struct {
	queries *repository.Queries
	config  *config.Config
}

func Init(db *pgx.Conn, config *config.Config) *Account {
	queries := repository.New(db)
	return &Account{queries, config}
}

func (a *Account) Register() http.Handler {
	router := router.NewRouter()
	router.Use(jwtauth.Verifier(a.config.SigningKey))
	router.Use(jwtauth.Authenticator())
	router.Get("/", a.GetAccounts)
	router.Post("/", a.CreateAccount)
	router.Get("/{id}", a.GetAccount)
	router.Put("/{id}", a.UpdateAccount)
	router.Delete("/{id}", a.DeleteAccount)

	return router
}
