package accounts

import "errors"

var (
	ErrAccountNotFound    = errors.New("accounts.not_found")
	ErrAccountTypeInvalid = errors.New("accounts.account_invalid")
)
