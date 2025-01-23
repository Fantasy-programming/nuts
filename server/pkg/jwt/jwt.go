package jwt

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Claims defines the custom JWT claims used in the application.
type Claims struct {
	jwt.RegisteredClaims
	Roles  []string  `json:"roles"`
	UserID uuid.UUID `json:"id"`
}

// GenerateToken creates a JWT with the given user ID, roles, signing key, and duration.
// Returns the signed token string or an error if signing fails.
func GenerateToken(userID uuid.UUID, roles []string, key string, duration time.Duration) (string, error) {
	if len(key) == 0 {
		return "", errors.New("signing key must not be empty")
	}
	if len(roles) == 0 {
		return "", errors.New("roles must not be empty")
	}

	claims := Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
		},
		UserID: userID,
		Roles:  roles,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(key))
}

// SplitJWT splits a JWT string into its header.payload and signature parts.
// Returns an error if the token format is invalid.
func SplitJWT(token string) (headerPayload string, signature string, err error) {
	parts := strings.Split(token, ".")

	if len(parts) != 3 {
		return "", "", fmt.Errorf("invalid JWT format")
	}

	return strings.Join(parts[:2], "."), parts[2], nil
}

// ReconstructJWT combines the header.payload and signature into a valid JWT string.
// Returns an error if any part is empty.
func ReconstructJWT(headerPayload string, signature string) (string, error) {
	if headerPayload == "" || signature == "" {
		return "", fmt.Errorf("headerPayload and signature must not be empty")
	}

	return fmt.Sprintf("%s.%s", headerPayload, signature), nil
}

// VerifyToken verifies a JWT string and returns the claims if valid.
// The signing key must match the key used to sign the token.
func VerifyRefreshToken(tokenStr string, key string) (*Claims, error) {
	if len(key) == 0 {
		return nil, errors.New("signing key must not be empty")
	}

	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		return []byte(key), nil
	})
	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
