package handlers

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/config"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/auth"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/auth/service"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/router"
	"github.com/markbates/goth"
	"github.com/markbates/goth/providers/google"
	"github.com/rs/zerolog"
)

func RegisterHTTPHandlers(service service.Auth, tkn *jwt.Service, config *config.Config, validator *validation.Validator, logger *zerolog.Logger) http.Handler {
	h := NewHandler(service, config, validator, logger)

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

		// gothic.GetProviderName = func(req *http.Request) (string, error) {
		// 	provider := req.PathValue("provider")
		// 	if provider != "" {
		// 		return provider, nil
		// 	}
		// 	return "", fmt.Errorf("no provider specified")
		// }

		router.Get("/oauth/google", h.GoogleHandler)
		router.Get("/oauth/google/callback", h.GoogleCallbackHandler)
	}

	// Authed - Router
	authedRouter := router.With(middleware.Verify)

	authedRouter.Post("/mfa/generate", h.InitiateMfaSetup)
	authedRouter.Post("/mfa/enable", h.VerifyMfaSetup)
	authedRouter.Delete("/mfa/disable", h.DisableMfa)

	// SESSIONS
	authedRouter.Get("/sessions", h.GetSessions)
	authedRouter.Post("/sessions/{id}/logout", h.RevokeSession)
	// authedRouter.Delete("/sessions", h.RevokeAllSessions) // TODO: Implement this

	// Register validator
	err := auth.RegisterValidations(validator.Validator)
	if err != nil {
		logger.Panic().Err(err).Msg("Failed to setup validator")
	}

	return router
}
