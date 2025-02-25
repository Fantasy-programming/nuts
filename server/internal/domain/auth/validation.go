package auth

import (
	"regexp"

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
	// nil checks
	if a.v == nil || a.v.Validator == nil {
		return
	}

	// Register custom validations
	a.v.Validator.RegisterValidation("strong_password", validateStrongPassword)
}

func validateStrongPassword(fl validator.FieldLevel) bool {
	password := fl.Field().String()
	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)
	hasSpecial := regexp.MustCompile(`[!@#~$%^&*()+|_.,<>?{}]`).MatchString(password)

	return hasUpper && hasLower && hasNumber && hasSpecial
}
