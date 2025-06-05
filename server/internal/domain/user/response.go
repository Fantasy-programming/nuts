package user

import (
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
)

type GetUserResponse struct {
	CreatedAt      time.Time                          `json:"created_at"`
	UpdatedAt      time.Time                          `json:"updated_at"`
	FirstName      *string                            `json:"first_name"`
	LastName       *string                            `json:"last_name"`
	AvatarUrl      *string                            `json:"avatar_url"`
	Email          string                             `json:"email"`
	LinkedAccounts *[]repository.GetLinkedAccountsRow `json:"linked_accounts"`
	MfaEnabled     bool                               `json:"mfa_enabled"`
	HasPassword    bool                               `json:"has_password"`
}

type UpdateUserRequest struct {
	Email     string  `json:"email"`
	FirstName *string `json:"first_name"`
	LastName  *string `json:"last_name"`
	Password  *string `json:"password"`
}
