package handlers

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/categories/service"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/router"
	"github.com/rs/zerolog"
)

func RegisterHTTPHandlers(service service.Category, tkn *jwt.Service, validator *validation.Validator, logger *zerolog.Logger) http.Handler {
	h := NewHandler(service, validator, logger)

	middleware := jwt.NewMiddleware(tkn)
	router := router.NewRouter()
	router.Use(middleware.Verify)

	router.Get("/", h.List)
	router.Post("/", h.Create)
	// router.Get("/{id}", h.Get)
	router.Put("/{id}", h.Update)
	router.Delete("/{id}", h.Delete)
	router.Post("/predict", h.Predict)

	return router
}
