package message

import "errors"

var (
	ErrBadRequest    = errors.New("error.bad_request")  // Bad request
	ErrInternalError = errors.New("error.internal")     // Internal Server Error
	ErrValidation    = errors.New("error.validation")   // Bad request
	ErrNoRecord      = errors.New("error.no_record")    // No Row found
	ErrMissingParams = errors.New("missing parameters") // No Row found
	ErrForbidden     = errors.New("error.forbidden")    // You don't have access
	ErrUnauthorized  = errors.New("error.bad_request")  // Bad request
)
