// This package helps in forming common Response and Errors
package respond

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/utility/i18n"
	"github.com/Fantasy-Programming/nuts/internal/utility/log"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/rs/zerolog"
)

type ErrorResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Error   any    `json:"error,omitempty"`
}

type SuccessResponse struct {
	Status  string `json:"status"`
	Message string `json:"message,omitempty"`
	Data    any    `json:"data,omitempty"`
}

type ErrorOptions struct {
	W          http.ResponseWriter
	R          *http.Request
	StatusCode int
	ClientErr  error
	ActualErr  error
	Logger     *zerolog.Logger
	Details    any
}

// Respond with a translated error message
func Error(opts ErrorOptions) {
	opts.W.Header().Set("Content-Type", "application/json")
	opts.W.WriteHeader(opts.StatusCode)

	message := i18n.T(opts.R.Context(), opts.ClientErr.Error(), nil) // user friendly message, language based answer for the user

	response := ErrorResponse{
		Status:  "error",
		Message: message,
	}

	// Add stack trace to the log entry
	log.WithStackTrace(opts.Logger.Error()).
		Int("status_code", opts.StatusCode).
		Err(opts.ActualErr).
		Interface("details", opts.Details).
		Msg("Error response")

	if err := json.NewEncoder(opts.W).Encode(response); err != nil {
		log.WithStackTrace(opts.Logger.Error()).
			Err(err).
			Msg("Failed to encode JSON error response")
	}
}

// Handle sending multiple error (mostly used for validation)
func Errors(opts ErrorOptions) {
	opts.W.Header().Set("Content-Type", "application/json")
	opts.W.WriteHeader(opts.StatusCode)

	message := i18n.T(opts.R.Context(), opts.ClientErr.Error(), nil)

	response := ErrorResponse{
		Status:  "error",
		Message: message,
		Error:   opts.ActualErr,
	}

	// Add stack trace to the log entry
	log.WithStackTrace(opts.Logger.Error()).
		Int("status_code", opts.StatusCode).
		Err(opts.ActualErr).
		Interface("details", opts.Details).
		Msg("Error response")

	if err := json.NewEncoder(opts.W).Encode(response); err != nil {
		log.WithStackTrace(opts.Logger.Error()).
			Err(err).
			Msg("Failed to encode JSON error response")
	}
}

// JsonResponse responds with a success message and optional data
func Json(w http.ResponseWriter, statusCode int, data any, logger *zerolog.Logger) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	// Handle nil payload
	if data == nil {
		_, _ = w.Write([]byte("{}"))
		logger.Debug().Int("status_code", statusCode).Msg("Empty JSON response")
		return
	}

	logger.Info().Int("status_code", statusCode).Interface("data", data).Msg("Success response")

	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.WithStackTrace(logger.Error()).
			Err(err).
			Msg("Failed to encode JSON error response")
	}
}

// TranslatedResponse responds with a translated success message
func Response(w http.ResponseWriter, r *http.Request, statusCode int, messageKey string, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	message := i18n.T(r.Context(), messageKey, nil)

	response := SuccessResponse{
		Status:  "success",
		Message: message,
		Data:    data,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		fmt.Println("error")
	}
}

// Status responds with just a status code
func Status(w http.ResponseWriter, statusCode int) {
	w.WriteHeader(statusCode)
}

// IsValidationError checks if the error is a validation error
func IsValidationError(err error) (validation.ValidationErrors, bool) {
	var validationErrors validation.ValidationErrors
	if errors.As(err, &validationErrors) {
		return validationErrors, true
	}
	return nil, false
}
