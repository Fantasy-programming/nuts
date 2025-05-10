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

type InitiateMfaResponse struct {
	QrCodeUrl string `json:"qr_code_url"`
	Secret    string `json:"secret"` // The setup key
}

type VerifyMfaRequest struct {
	Otp string `json:"otp" validate:"required,len=6,numeric"`
}

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
