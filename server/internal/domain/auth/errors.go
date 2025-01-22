package auth

import "errors"

var (
	ErrWrongCred     = errors.New("Wrong username or password")
	ErrEmailRequired = errors.New("email is required")
	ErrPasswordReq   = errors.New("password doesn't meet the critera")
	ErrExistingUser  = errors.New("user already exists")
)
