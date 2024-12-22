package user

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/config"
	"github.com/Fantasy-Programming/nuts/internal/middleware/jwtauth"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/jackc/pgx/v5"
)

type User struct {
	queries *repository.Queries
	config  *config.Config
}

func Init(db *pgx.Conn, config *config.Config) *User {
	queries := repository.New(db)
	return &User{queries, config}
}

func (u *User) Register() http.Handler {
	router := router.NewRouter()
	router.Use(jwtauth.Verifier(u.config.SigningKey))
	router.Use(jwtauth.Authenticator())
	router.Get("/me", u.GetInfo)
	router.Put("/me", u.UpdateInfo)
	router.Delete("/me", u.DeleteInfo)
	return router
}
