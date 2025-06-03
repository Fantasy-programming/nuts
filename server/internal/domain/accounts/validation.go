package accounts

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/google/uuid"
)

type CreateAccountRequest struct {
	Meta     *[]byte `json:"meta,omitempty" validate:"omitempty"`
	Name     string  `json:"name" validate:"required"`
	Type     string  `json:"type" validate:"required"`
	Currency string  `json:"currency" validate:"required"`
	Color    string  `json:"color" validate:"required"`
	Balance  float64 `json:"balance" validate:"gte=0"`
}

type UpdateAccountRequest struct {
	Name     *string  `json:"name" validate:"required"`
	Type     *string  `json:"type" validate:"required"`
	Balance  *float64 `json:"balance" validate:"required"`
	Currency *string  `json:"currency" validate:"required"`
	Color    *string  `json:"color" validate:"required"`
	Meta     *[]byte  `json:"meta,omitempty" validate:"omitempty"`
}

type CreateLinkTokenRequest struct {
	Provider     string   `json:"provider" validate:"required,oneof=plaid teller gocardless mono brankas"`
	Products     []string `json:"products,omitempty"`
	CountryCodes []string `json:"country_codes,omitempty"`
	RedirectURI  string   `json:"redirect_uri,omitempty"`
}

// ConnectAccountRequest represents the request to connect an external account
type ConnectAccountRequest struct {
	Provider    string `json:"provider" validate:"required"`
	PublicToken string `json:"public_token" validate:"required"`
}

// SyncAccountsRequest represents the request to sync accounts from a provider
type SyncAccountsRequest struct {
	Provider string `json:"provider" validate:"required"`
	Force    bool   `json:"force,omitempty"` // Force sync even if recently synced
}

type TellerConnectRequest struct {
	AccessToken string `json:"accessToken" validate:"required"`
	Enrollment  struct {
		ID          string `json:"id"`
		Institution struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		} `json:"institution"`
	} `json:"enrollment"`
	User struct {
		ID string `json:"id"`
	} `json:"user"`
}

type MonoConnectRequest struct {
	Code string `json:"code" validate:"required"`
}

// Extract pathParam & parse into uuid
func parseUUID(r *http.Request, paramName string) (uuid.UUID, error) {
	idStr := r.PathValue(paramName)
	if idStr == "" {
		return uuid.Nil, message.ErrMissingParams
	}
	return uuid.Parse(idStr)
}

func validateAccountType(input string) (repository.ACCOUNTTYPE, error) {
	var act repository.ACCOUNTTYPE
	if err := act.Scan(input); err != nil || !act.Valid() {
		return act, message.ErrBadRequest
	}
	return act, nil
}

func validateNullableAccountType(input string) (repository.NullACCOUNTTYPE, error) {
	var act repository.NullACCOUNTTYPE
	if err := act.Scan(input); err != nil || !act.ACCOUNTTYPE.Valid() {
		return act, message.ErrBadRequest
	}
	return act, nil
}

func validateColor(input string) (repository.COLORENUM, error) {
	var color repository.COLORENUM
	if err := color.Scan(input); err != nil || !color.Valid() {
		return color, message.ErrBadRequest
	}
	return color, nil
}

func validateNullableColor(input string) (repository.NullCOLORENUM, error) {
	var color repository.NullCOLORENUM
	if err := color.Scan(input); err != nil || !color.COLORENUM.Valid() {
		return color, message.ErrBadRequest
	}
	return color, nil
}

func parseMeta(meta *[]byte) []byte {
	if meta != nil {
		return []byte(*meta)
	}
	return nil
}
