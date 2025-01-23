package message

import "errors"

var (
	ErrBadRequest    = errors.New("error bad request")     // Bad request
	ErrInternalError = errors.New("internal server error") // Internal Server Error
	ErrValidation    = errors.New("validation error")      // Bad request
	ErrNoRecord      = errors.New("no record found")       // No Row found
	ErrMissingParams = errors.New("missing parameters")    // No Row found
)
