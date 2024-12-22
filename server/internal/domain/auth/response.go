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
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	FirstName *string   `json:"first_name"`
	LastName  *string   `json:"last_name"`
	Email     string    `json:"email"`
	ID        uuid.UUID `json:"id"`
}
