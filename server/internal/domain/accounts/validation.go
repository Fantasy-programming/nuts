package accounts

import (
	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
)

func ValidateAccountType(input string) (repository.ACCOUNTTYPE, error) {
	var act repository.ACCOUNTTYPE
	if err := act.Scan(input); err != nil || !act.Valid() {
		return act, message.ErrBadRequest
	}
	return act, nil
}

func ValidateNullableAccountType(input string) (repository.NullACCOUNTTYPE, error) {
	var act repository.NullACCOUNTTYPE
	if err := act.Scan(input); err != nil || !act.ACCOUNTTYPE.Valid() {
		return act, message.ErrBadRequest
	}
	return act, nil
}
