package auth

import (
	"time"

	"github.com/google/uuid"
)

type LoginResponse struct {
	Token string `json:"token"`
	User  UserProfile
}

type UserProfile struct {
	ID        uuid.UUID `json:"id"`
	Email     string    `json:"email"`
	FirstName *string   `json:"first_name"`
	LastName  *string   `json:"last_name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
