package accounts

import "github.com/Fantasy-Programming/nuts/server/internal/repository/dto"

type CreateAccountRequest struct {
	Meta     dto.AccountMeta `json:"meta,omitempty" validate:"omitempty"`
	Name     string          `json:"name" validate:"required"`
	Type     string          `json:"type" validate:"required"`
	Currency string          `json:"currency" validate:"required"`
	Balance  float64         `json:"balance" validate:"gte=0"`
}

type UpdateAccountRequest struct {
	Name     *string         `json:"name" validate:"required"`
	Type     *string         `json:"type" validate:"required"`
	Balance  *float64        `json:"balance" validate:"required"`
	Currency *string         `json:"currency" validate:"required"`
	Meta     dto.AccountMeta `json:"meta,omitempty" validate:"omitempty"`
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
	Code          string `json:"code" validate:"required"`
	Institution   string `json:"institution" validate:"required"`
	InstitutionID string `json:"institutionID" validate:"required"`
}
