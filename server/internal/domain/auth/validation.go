package auth

import (
	"regexp"

	"github.com/go-playground/validator/v10"
)

func RegisterValidations(v *validator.Validate) error {
	// nil checks
	if v == nil {
		return nil
	}

	// Register custom validations
	return v.RegisterValidation("strong_password", validateStrongPassword)
}

func validateStrongPassword(fl validator.FieldLevel) bool {
	password := fl.Field().String()
	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)
	hasSpecial := regexp.MustCompile(`[!@#~$%^&*()+|_.,<>?{}]`).MatchString(password)

	return hasUpper && hasLower && hasNumber && hasSpecial
}
