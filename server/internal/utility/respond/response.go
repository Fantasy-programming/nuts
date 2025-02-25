// This package helps in forming common Response and Errors
package respond

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/middleware/i18n"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/rs/zerolog"
)

type ErrorResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Error   interface{} `json:"error,omitempty"`
}

type SuccessResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

type ErrorOptions struct {
	W          http.ResponseWriter
	R          *http.Request
	StatusCode int
	ClientErr  error
	ActualErr  error
	Logger     *zerolog.Logger
	Details    interface{}
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

	opts.Logger.Error().Int("status_code", opts.StatusCode).Err(opts.ActualErr).Interface("details", opts.Details).Msg("Error response")
	json.NewEncoder(opts.W).Encode(response)
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

	opts.Logger.Error().Int("status_code", opts.StatusCode).Err(opts.ActualErr).Interface("details", opts.Details).Msg("Error response")

	json.NewEncoder(opts.W).Encode(response)
}

// JsonResponse responds with a success message and optional data
func Json(w http.ResponseWriter, statusCode int, data interface{}, logger *zerolog.Logger) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	// Handle nil payload
	if data == nil {
		_, _ = w.Write([]byte("{}"))
		logger.Debug().Int("status_code", statusCode).Msg("Empty JSON response")
		return
	}

	logger.Info().Int("status_code", statusCode).Interface("data", data).Msg("Success response")
	json.NewEncoder(w).Encode(data)
}

// TranslatedResponse responds with a translated success message
func Response(w http.ResponseWriter, r *http.Request, statusCode int, messageKey string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	message := i18n.T(r.Context(), messageKey, nil)

	response := SuccessResponse{
		Status:  "success",
		Message: message,
		Data:    data,
	}

	json.NewEncoder(w).Encode(response)
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
