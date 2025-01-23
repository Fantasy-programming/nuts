package validation

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

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

func (ve ValidationErrors) Error() string {
	var errMsg string
	for _, v := range ve {
		errMsg += fmt.Sprintf("Field '%s': %s\n", v.Field, v.Message)
	}
	return errMsg
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

func TranslateErrors(err error, trans ut.Translator) ValidationErrors {
	var validationErrors ValidationErrors
	for _, err := range err.(validator.ValidationErrors) {
		validationErrors = append(validationErrors, ValidationError{
			Field:   err.Field(),
			Message: err.Translate(trans),
		})
	}
	return validationErrors
}

func ParseAndValidate(r *http.Request, req interface{}, validator *Validator, trans ut.Translator) error {
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		return fmt.Errorf("malformed request: %w", err)
	}
	if err := validator.Validator.Struct(req); err != nil {
		return TranslateErrors(err, trans)
	}
	return nil
}

func Validate(v *validator.Validate, generic any) []string {
	err := v.Struct(generic)
	if err != nil {
		var invalidValidationError *validator.InvalidValidationError

		if errors.As(err, &invalidValidationError) {
			fmt.Println(err)
			return nil
		}

		var errs []string
		for _, err := range err.(validator.ValidationErrors) {
			errs = append(errs, fmt.Sprintf("%s is %s with type %s", err.StructField(), err.Tag(), err.Type()))
		}

		return errs
	}
	return nil
}
