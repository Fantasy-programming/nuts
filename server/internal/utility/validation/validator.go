package validation

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	i18nMiddleware "github.com/Fantasy-Programming/nuts/internal/middleware/i18n"
	"github.com/go-playground/validator/v10"
)

// ValidationError represents a single validation error
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ValidationErrors is a slice of validation errors
type ValidationErrors []ValidationError

// Validator provides validation functionality
type Validator struct {
	Validator *validator.Validate
}

// New creates a new validator
func New() *Validator {
	validate := validator.New(validator.WithRequiredStructEnabled())
	return &Validator{
		Validator: validate,
	}
}

// ParseAndValidate parses the request body and validates it
func ParseAndValidate(ctx context.Context, r *http.Request, req interface{}) (ValidationErrors, error) {
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		return nil, fmt.Errorf("malformed request: %w", err)
	}

	if err := validator.New().Struct(req); err != nil {
		return TranslateErrors(ctx, err), nil
	}

	return nil, nil
}

// TranslateErrors translates validation errors using i18n
func TranslateErrors(ctx context.Context, err error) ValidationErrors {
	validationErrors := ValidationErrors{}

	if err == nil {
		return validationErrors
	}

	validErrs, ok := err.(validator.ValidationErrors)
	if !ok {
		return validationErrors
	}

	i18nInstance, lang := i18nMiddleware.FromContext(ctx)

	for _, fieldErr := range validErrs {
		field := fieldName(fieldErr.Field())
		tag := fieldErr.Tag()
		param := fieldErr.Param()

		// Create template data for translation
		templateData := map[string]interface{}{
			"Field": field,
			"Param": param,
		}

		// Try to get a translation for this specific validation tag
		var message string
		if i18nInstance != nil {
			messageID := fmt.Sprintf("validation.%s", tag)
			message = i18nInstance.T(lang, messageID, templateData)
		} else {
			// Fallback if i18n is not available
			message = defaultErrorMessage(tag, field, param)
		}

		validationErrors = append(validationErrors, ValidationError{
			Field:   field,
			Message: message,
		})
	}

	return validationErrors
}

// fieldName converts the struct field name to a user-friendly form
func fieldName(field string) string {
	return strings.ToLower(field)
}

// defaultErrorMessage provides a fallback error message when i18n is not available
func defaultErrorMessage(tag string, field string, param string) string {
	switch tag {
	case "required":
		return fmt.Sprintf("The %s field is required", field)
	case "email":
		return fmt.Sprintf("Please enter a valid email address for %s", field)
	case "min":
		return fmt.Sprintf("The %s must be at least %s characters", field, param)
	case "max":
		return fmt.Sprintf("The %s cannot be longer than %s characters", field, param)
	case "strong_password":
		return "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
	default:
		return fmt.Sprintf("The %s field is invalid", field)
	}
}

// RegisterCustomValidation registers custom validation functions
func (v *Validator) RegisterCustomValidation(tag string, fn validator.Func) error {
	return v.Validator.RegisterValidation(tag, fn)
}
