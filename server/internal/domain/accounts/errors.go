package accounts

import "errors"

var (
	ErrAccountNotFound    = errors.New("This account doesn't exist")
	ErrAccountTypeInvalid = errors.New("Invalid Account type")
)
