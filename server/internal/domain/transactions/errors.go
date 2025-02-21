package transactions

import "errors"

var ErrNoTransactions = errors.New("no transaction with given ID")
var ErrSameAccount = errors.New("source and destination accounts cannot be the same")
var ErrSrcAccNotFound = errors.New("source account not found")
var ErrDestAccNotFound = errors.New("destination account not found")
var ErrLowBalance = errors.New("insufficent balance")
