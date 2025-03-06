package user

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/config"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/Fantasy-Programming/nuts/pkg/storage"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

type User struct {
	queries *repository.Queries
	storage *storage.Storage
	tkn     *jwt.TokenService
	v       *validation.Validator
	config  *config.Config
	log     *zerolog.Logger
}

func Init(db *pgxpool.Pool, storage *storage.Storage, tkn *jwt.TokenService, validate *validation.Validator, config *config.Config, logger *zerolog.Logger) *User {
	queries := repository.New(db)
	return &User{queries, storage, tkn, validate, config, logger}
}

func (u *User) Register() http.Handler {
	router := router.NewRouter()
	router.Use(u.tkn.Verify)
	router.Get("/me", u.GetInfo)
	router.Put("/me", u.UpdateInfo)
	router.Delete("/me", u.DeleteInfo)

	// Avatar endpoint
	router.Put("/me/avatar", u.UploadAvatar)
	return router
}
