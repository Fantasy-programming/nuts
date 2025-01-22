package validation

import (
	"fmt"

	"github.com/go-playground/locales"
	"github.com/go-playground/locales/en"
	"github.com/go-playground/locales/es"
	"github.com/go-playground/locales/fr"
	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	en_translations "github.com/go-playground/validator/v10/translations/en"
	es_translations "github.com/go-playground/validator/v10/translations/es"
	fr_translations "github.com/go-playground/validator/v10/translations/fr"
)

type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

type ValidationErrors []ValidationError

type ErrorResponse struct {
	Status  string           `json:"status"`
	Message string           `json:"message"`
	Errors  ValidationErrors `json:"errors"`
}

func NewErrorResponse(message string, errors ValidationErrors) ErrorResponse {
	return ErrorResponse{
		Status:  "error",
		Message: message,
		Errors:  errors,
	}
}

type Validator struct {
	Validator *validator.Validate
	Uni       *ut.UniversalTranslator
}

func New() *Validator {
	english := en.New()
	uni := ut.New(english, []locales.Translator{
		english,
		fr.New(),
		es.New(),
	}...)

	validate := validator.New(validator.WithRequiredStructEnabled())

	// Register default English translations
	trans, _ := uni.GetTranslator("en")
	en_translations.RegisterDefaultTranslations(validate, trans)

	return &Validator{
		Validator: validate,
		Uni:       uni,
	}
}

// GetTranslator returns the appropriate translator based on language code
func (v *Validator) GetTranslator(lang string) (ut.Translator, error) {
	trans, found := v.Uni.GetTranslator(lang)

	if !found {
		trans, _ = v.Uni.GetTranslator("en") // Fallback to English
		return trans, fmt.Errorf("translator not found for: %s, using English", lang)
	}

	// Register translations for the selected language
	switch lang {
	case "fr":
		fr_translations.RegisterDefaultTranslations(v.Validator, trans)
	case "es":
		es_translations.RegisterDefaultTranslations(v.Validator, trans)
	}

	return trans, nil
}
