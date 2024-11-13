package auth

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/config"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/jackc/pgx/v5"
)

type Auth struct {
	queries *repository.Queries
	config  *config.Config
}

func Init(db *pgx.Conn, config *config.Config) *Auth {
	queries := repository.New(db)
	return &Auth{queries, config}
}

func (a *Auth) Register() http.Handler {
	router := router.NewRouter()
	router.Post("/login", a.Login)
	router.Post("/signup", a.Signup)
	router.Post("/logout", a.Logout)
	router.Post("/refresh", a.Refresh)
	return router
}
