package pass

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	jwt.RegisteredClaims
	UserId uuid.UUID `json:"id"`
}

// TODO: ADD Stuff on the claims
func GenerateToken(id uuid.UUID, roles []string, key string, duration time.Duration) (string, error) {
	expirationTime := time.Now().Add(duration)

	claims := jwt.MapClaims{
		"UserId": id,
		"roles":  roles,
		"iat":    time.Now().Unix(),
		"exp":    expirationTime,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(key))
	return tokenString, err
}

func SplitJWT(token string) (headerPayload string, signature string, err error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return "", "", fmt.Errorf("invalid JWT format")
	}

	headerPayload = strings.Join(parts[:2], ".") // header.payload
	signature = parts[2]                         // signature
	return headerPayload, signature, nil
}

func ReconstructJWT(headerPayload string, signature string) (string, error) {
	if headerPayload == "" || signature == "" {
		return "", fmt.Errorf("headerPayload and signature must not be empty")
	}

	return headerPayload + "." + signature, nil
}

func VerifyRefreshToken(tokenStr string, key string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return key, nil
	})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	} else {
		return nil, errors.New("invalid token")
	}
}
