package auth

import "errors"

var (
	ErrWrongCred     = errors.New("auth.wrong_credentials")
	ErrEmailRequired = errors.New("auth.email_required")
	ErrPasswordReq   = errors.New("auth.password_critera")
	ErrExistingUser  = errors.New("auth.user_exists")
	ErrWrong2FA      = errors.New("auth.wrong_mfa")
)
