package transactions

import "errors"

var (
	ErrNoTransactions  = errors.New("no transaction with given ID")
	ErrSameAccount     = errors.New("source and destination accounts cannot be the same")
	ErrSrcAccNotFound  = errors.New("source account not found")
	ErrDestAccNotFound = errors.New("destination account not found")
	ErrLowBalance      = errors.New("insufficient balance")
)
