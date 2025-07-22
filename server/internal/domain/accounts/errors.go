package accounts

import "errors"

var (
	ErrAccountNotFound          = errors.New("accounts.not_found")
	ErrAccountTypeInvalid       = errors.New("accounts.account_invalid")
	ErrAccountQueryParamInvalid = errors.New("accounts.invalid_start_date")
	ErrEndDateBeforeStart       = errors.New("accounts.end_before_start")
)

var (
	MonoLinkedMessage   = "accounts.mono.success"
	TellerLinkedMessage = "accounts.teller.success"
)

// var TellerLinkedMessage =  "Teller connection successful. Accounts are being processed."
// var MonoLinkedMessage = "Mono account linked successfully. Financial data synchronization will follow."
