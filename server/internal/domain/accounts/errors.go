package accounts

import "errors"

var (
	ErrAccountNotFound          = errors.New("accounts.not_found")
	ErrAccountTypeInvalid       = errors.New("accounts.account_invalid")
	ErrAccountQueryParamInvalid = errors.New("accounts.invalid_start_date")
	ErrEndDateBeforeStart       = errors.New("accounts.end_before_start")
)
