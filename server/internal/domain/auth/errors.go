package auth

import "errors"

var (
	ErrWrongCred           = errors.New("auth.wrong_credentials")
	ErrMissingUser         = errors.New("auth.missing_user")
	ErrEmailRequired       = errors.New("auth.email_required")
	ErrPasswordReq         = errors.New("auth.password_critera")
	ErrExistingUser        = errors.New("auth.user_exists")
	ErrWrong2FA            = errors.New("auth.wrong_mfa")
	ErrMissing2FACode      = errors.New("auth.missing_mfa")
	ErrMissingMFASecret    = errors.New("auth.missing_mfa_secret")
	ErrInvalidOrExpiredMfa = errors.New("auth.invalid_or_expired_mfa")
)
