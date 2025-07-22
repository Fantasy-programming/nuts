package handlers

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/user/service"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/router"
	"github.com/rs/zerolog"
)

func RegisterHTTPHandlers(service service.Users, tkn *jwt.Service, validator *validation.Validator, logger *zerolog.Logger) http.Handler {
	h := NewHandler(service, validator, logger)

	middleware := jwt.NewMiddleware(tkn)

	router := router.NewRouter()
	router.Use(middleware.Verify)

	router.Get("/me", h.GetInfo)
	router.Put("/me", h.UpdateInfo)
	router.Delete("/me", h.DeleteInfo)
	router.Put("/me/avatar", h.UploadAvatar)

	// preferences
	router.Get("/preferences", h.GetPreferences)
	router.Put("/preferences", h.UpdatePreferences)

	return router
}
