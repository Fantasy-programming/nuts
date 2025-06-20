package auth

type SignupRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8,strong_password"`
}

type LoginRequest struct {
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required"`
	TwoFACode string `json:"two_fa_code"`
}

type VerifyMfaRequest struct {
	Otp string `json:"otp" validate:"required,len=6,numeric"`
}

type InitiateMfaResponse struct {
	QrCodeUrl string `json:"qr_code_url"`
	Secret    string `json:"secret"`
}

type LoginResponse struct {
	Token         string `json:"token"`
	TwoFARequired bool   `json:"two_fa_required"` // Indicate if 2FA is required for next step
}
