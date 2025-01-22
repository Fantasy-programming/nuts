package jwtauth

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/Fantasy-Programming/nuts/pkg/pass"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type JWTAuth struct {
	alg       *jwt.SigningMethodHMAC
	signKey   interface{} // private-key
	verifyKey interface{} // public-key, only used by RSA and ECDSA algorithms
}

var (
	CookieHeader    = "nutsPayload"
	CookieSignature = "nutsSignature"
)

var (
	TokenCtxKey = &contextKey{"Token"}
	ErrorCtxKey = &contextKey{"Error"}
)

var (
	ErrUnauthorized = errors.New("token is unauthorized")
	ErrExpired      = errors.New("token is expired")
	ErrInvalid      = errors.New("token is invalid")
	ErrNBFInvalid   = errors.New("token nbf validation failed")
	ErrIATInvalid   = errors.New("token iat validation failed")
	ErrNoTokenFound = errors.New("JWT Token not found")
	ErrAlgoInvalid  = errors.New("algorithm mismatch")
)

func Verifier(key string) func(http.Handler) http.Handler {
	return Verify(key, TokenFromHeader, TokenDoubleCookie)
}

func Verify(key string, findTokenFns ...func(r *http.Request) string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		hfn := func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			token, err := VerifyRequest(key, r, findTokenFns...)
			ctx = NewContext(ctx, token, err)
			next.ServeHTTP(w, r.WithContext(ctx))
		}
		return http.HandlerFunc(hfn)
	}
}

func VerifyRequest(key string, r *http.Request, findTokenFns ...func(r *http.Request) string) (jwt.Token, error) {
	var tokenString string

	// Extract token string from the request by calling token find functions in
	// the order they where provided. Further extraction stops if a function
	// returns a non-empty string.
	for _, fn := range findTokenFns {
		tokenString = fn(r)
		if tokenString != "" {
			break
		}
	}

	if tokenString == "" {
		return jwt.Token{}, ErrNoTokenFound
	}

	return VerifyToken(key, tokenString)
}

func VerifyToken(key string, tokenString string) (jwt.Token, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
		}

		return []byte(key), nil
	})
	if err != nil {
		return jwt.Token{}, ErrorReason(err)
	}

	if token == nil {
		return jwt.Token{}, ErrUnauthorized
	}

	if !token.Valid {
		return jwt.Token{}, ErrInvalid
	}

	// Valid!
	return *token, nil
}

// ErrorReason will normalize the error message from the underlining
// jwt library
func ErrorReason(err error) error {
	switch {
	case errors.Is(err, jwt.ErrTokenExpired), err == ErrExpired:
		return ErrExpired
	case errors.Is(err, jwt.ErrTokenInvalidIssuer), err == ErrIATInvalid:
		return ErrIATInvalid
	case errors.Is(err, jwt.ErrTokenNotValidYet), err == ErrNBFInvalid:
		return ErrNBFInvalid
	default:
		return ErrUnauthorized
	}
}

// Authenticator is a default authentication middleware to enforce access from the
// Verifier middleware request context values. The Authenticator sends a 401 Unauthorized
// response for any unverified tokens and passes the good ones through. It's just fine
// until you decide to write something similar and customize your client response.

func Authenticator(key string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		hfn := func(w http.ResponseWriter, r *http.Request) {
			_, claims, err := FromContext(r.Context())
			if err != nil {
				http.Error(w, err.Error(), http.StatusUnauthorized)
				return
			}

			// extract the claims
			userRawId, IdOk := claims["UserId"].(string)
			rolesRaw, RolesOk := claims["roles"].([]interface{})

			log.Println(userRawId)

			if !IdOk || !RolesOk {
				http.Error(w, "User ID or Roles not found in claims", http.StatusUnauthorized)
				return
			}

			// convert string to uuid
			userId, err := uuid.Parse(userRawId)
			if err != nil {
				http.Error(w, "How is it possible", http.StatusInternalServerError)
				return
			}

			// convert roles to string[]

			roles := []string{}
			for _, role := range rolesRaw {
				if roleStr, ok := role.(string); ok {
					roles = append(roles, roleStr)
				} else {
					log.Println("Invalid role type in claims")
				}
			}

			// Refresh the JWT Token
			token, err := pass.GenerateToken(userId, roles, key, time.Minute*30)
			if err != nil {
				log.Println("Auth: Failed to re-generate JWT", err)
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}

			headerToken, signature, err := pass.SplitJWT(token)
			if err != nil {
				log.Println("Auth: Failed to split JWT", err)
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}

			http.SetCookie(w, &http.Cookie{
				Name:     CookieHeader,
				Value:    headerToken,
				Path:     "/",
				Expires:  time.Now().Add(30 * time.Minute),
				SameSite: http.SameSiteStrictMode,
				// Secure:  true, // Uncomment if using HTTPS
			})

			http.SetCookie(w, &http.Cookie{
				Name:     CookieSignature,
				Value:    signature,
				Path:     "/",
				HttpOnly: true,
				SameSite: http.SameSiteStrictMode,
				// Secure:   true, // Uncomment if using HTTPS
			})

			// Token is authenticated, pass it through
			next.ServeHTTP(w, r)
		}
		return http.HandlerFunc(hfn)
	}
}

func NewContext(ctx context.Context, t jwt.Token, err error) context.Context {
	ctx = context.WithValue(ctx, TokenCtxKey, t)
	ctx = context.WithValue(ctx, ErrorCtxKey, err)
	return ctx
}

func FromContext(ctx context.Context) (jwt.Token, map[string]interface{}, error) {
	token, _ := ctx.Value(TokenCtxKey).(jwt.Token)

	var err error
	var claims map[string]interface{}

	if token.Valid {
		claims = token.Claims.(jwt.MapClaims)
	} else {
		claims = map[string]interface{}{}
	}

	err, _ = ctx.Value(ErrorCtxKey).(error)

	return token, claims, err
}

func GetID(r *http.Request) (uuid.UUID, error) {
	_, claims, _ := FromContext(r.Context())

	idStr := claims["UserId"].(string)

	return uuid.Parse(idStr)
}

// Get the token from the double cookie (signature + header)
func TokenDoubleCookie(r *http.Request) string {
	headerCookie, err1 := r.Cookie(CookieHeader)
	signatureCookie, err2 := r.Cookie(CookieSignature)

	if err1 != nil || err2 != nil {
		return ""
	}

	return headerCookie.Value + "." + signatureCookie.Value
}

// Get the token in the bearer format from the authorization header
func TokenFromHeader(r *http.Request) string {
	bearer := r.Header.Get("Authorization")

	if len(bearer) > 7 && strings.ToUpper(bearer[0:6]) == "BEARER" {
		return bearer[7:]
	}
	return ""
}

type contextKey struct {
	name string
}

func (k *contextKey) String() string {
	return "jwtauth context value " + k.name
}
