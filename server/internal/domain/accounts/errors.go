package accounts

import "errors"

var (
	ErrAccountNotFound          = errors.New("accounts.not_found")
	ErrAccountTypeInvalid       = errors.New("accounts.account_invalid")
	ErrAccountQueryParamInvalid = errors.New("invalid start date format. Use YYYY-MM-DD")
	ErrEndDateBeforeStart       = errors.New("start date cannot be after end date")
)
