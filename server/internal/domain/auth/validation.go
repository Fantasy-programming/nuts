package auth

import (
	"regexp"

	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
)

type SignupRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8,strong_password"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

func (a *Auth) registerValidations() {
	// Register custom validations
	a.validate.Validator.RegisterValidation("strong_password", validateStrongPassword)

	// Register translations for all supported languages
	for lang, trans := range translations {
		translator, _ := a.validate.GetTranslator(lang)
		registerTranslations(a.validate.Validator, translator, trans)
	}
}

func validateStrongPassword(fl validator.FieldLevel) bool {
	password := fl.Field().String()
	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)
	hasSpecial := regexp.MustCompile(`[!@#~$%^&*()+|_.,<>?{}]`).MatchString(password)

	return hasUpper && hasLower && hasNumber && hasSpecial
}

func registerTranslations(v *validator.Validate, trans ut.Translator, translations []TranslationKey) {
	for _, t := range translations {
		v.RegisterTranslation(t.Tag, trans,
			func(ut ut.Translator) error {
				return ut.Add(t.Tag, t.Message, true)
			},
			func(ut ut.Translator, fe validator.FieldError) string {
				t, _ := ut.T(fe.Tag(), fe.Field())
				return t
			},
		)
	}
}
