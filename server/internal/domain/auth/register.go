package auth

import (
	"fmt"
	"net/http"

	"github.com/Fantasy-Programming/nuts/config"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/google"
	"github.com/rs/zerolog"
)

func RegisterHTTPHandlers(db *pgxpool.Pool, validate *validation.Validator, tkn *jwt.Service, config *config.Config, logger *zerolog.Logger) http.Handler {
	queries := repository.New(db)
	repo := NewRepository(db, queries)
	h := NewHandler(validate, tkn, repo, logger)

	router := router.NewRouter()
	router.Post("/login", h.Login)
	router.Post("/signup", h.Signup)
	router.Post("/logout", h.Logout)
	router.Post("/refresh", h.Refresh)

	if config.GoogleAuthEnabled {

		if config.GoogleClientID == "" || config.GoogleClientSecret == "" || config.GoogleCallbackURL == "" {
			logger.Panic().Msg("Error: Google OAuth environment variables are not set in .env")
		}

		goth.UseProviders(
			google.New(config.GoogleClientID, config.GoogleClientSecret, config.GoogleCallbackURL, "email", "profile"),
		)

		gothic.GetProviderName = func(req *http.Request) (string, error) {
			provider := req.PathValue("provider")
			if provider != "" {
				return provider, nil
			}
			return "", fmt.Errorf("no provider specified")
		}

		router.Get("/oauth/{provider}", h.GoogleHandler)
		router.Get("/oauth/{provider}/callback", h.GoogleCallbackHandler)
	}

	// Register validator
	RegisterValidations(validate.Validator)

	return router
}
