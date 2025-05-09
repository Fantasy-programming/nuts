package jwt

import (
	"net/http"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func GetUserID(r *http.Request) (uuid.UUID, error) {
	claims, ok := r.Context().Value(ContextKey).(jwt.MapClaims)

	if !ok {
		return uuid.Nil, ErrNoTokenFound
	}

	id, ok := claims["id"].(string)

	if !ok {
		return uuid.Nil, ErrInvalidToken
	}

	return uuid.Parse(id)
}
