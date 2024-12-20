package transactions

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/config"
	"github.com/Fantasy-Programming/nuts/internal/middleware/jwtauth"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/jackc/pgx/v5"
)

type Transactions struct {
	queries *repository.Queries
	config  *config.Config
}

func Init(db *pgx.Conn, config *config.Config) *Transactions {
	queries := repository.New(db)
	return &Transactions{queries, config}
}

func (a *Transactions) Register() http.Handler {
	router := router.NewRouter()
	router.Use(jwtauth.Verifier(a.config.SigningKey))
	router.Use(jwtauth.Authenticator())
	router.Get("/", a.GetTransactions)
	router.Post("/", a.CreateTransaction)
	router.Get("/{id}", a.GetTransaction)
	router.Put("/{id}", a.UpdateTransaction)
	router.Delete("/{id}", a.DeleteTransaction)

	return router
}
