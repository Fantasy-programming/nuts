package auth

import (
	"fmt"
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/config"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/user"
	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/encrypt"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/router"
	"github.com/Fantasy-Programming/nuts/server/pkg/storage"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/google"
	"github.com/rs/zerolog"
)

func RegisterHTTPHandlers(db *pgxpool.Pool, storage storage.Storage, validate *validation.Validator, tkn *jwt.Service, config *config.Config, logger *zerolog.Logger) http.Handler {
	queries := repository.New(db)
	repo := user.NewRepository(db, queries, storage)
	encrypt, err := encrypt.NewEncrypter(config.EncryptionSecretKeyHex)
	if err != nil {
		logger.Panic().Err(err).Msg("Failed to setup encrypter")
	}

	h := NewHandler(config, validate, encrypt, tkn, repo, logger)

	// Create the auth verify middleware
	middleware := jwt.NewMiddleware(tkn)

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

	// Authed - Router
	authedRouter := router.With(middleware.Verify)

	// 2FA - TOTP (change to /2fa/)
	authedRouter.Post("/mfa/generate", h.InitiateMfaSetup)
	authedRouter.Post("/mfa/enable", h.VerifyMfaSetup)
	authedRouter.Delete("/mfa/disable", h.DisableMfa)

	// SESSIONS
	authedRouter.Get("/sessions", h.GetSessions)
	authedRouter.Post("/sessions/{id}/logout", h.RevokeSession)
	// authedRouter.Delete("/sessions", h.RevokeAllSessions) // TODO: Implement this

	// Register validator
	err = RegisterValidations(validate.Validator)
	if err != nil {
		logger.Panic().Err(err).Msg("Failed to setup validator")
	}

	return router
}
