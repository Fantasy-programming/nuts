package transactions

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

type Transactions struct {
	db       *pgxpool.Pool
	queries  *repository.Queries
	config   *config.Config
	validate *validation.Validator
	log      *zerolog.Logger
}

func Init(db *pgxpool.Pool, config *config.Config, validate *validation.Validator, logger *zerolog.Logger) *Transactions {
	queries := repository.New(db)
	return &Transactions{db, queries, config, validate, logger}
}

func (a *Transactions) Register() http.Handler {
	router := router.NewRouter()
	router.Use(jwtauth.Verifier(a.config.SigningKey))
	router.Use(jwtauth.Authenticator(a.config.SigningKey))
	router.Get("/", a.GetTransactions)
	router.Post("/", a.CreateTransaction)
	router.Post("/transfert", a.CreateTransfert)
	router.Get("/{id}", a.GetTransaction)
	router.Put("/{id}", a.UpdateTransaction)
	router.Delete("/{id}", a.DeleteTransaction)

	return router
}
