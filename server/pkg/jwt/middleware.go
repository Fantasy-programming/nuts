package jwt

import (
	"context"
	"net/http"
	"strings"
)

type Middleware struct {
	service *Service
}

func NewMiddleware(service *Service) *Middleware {
	return &Middleware{
		service: service,
	}
}

// Verify authenticates requests using JWT tokens
func (m *Middleware) Verify(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenString := extractToken(r)

		if tokenString == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Verify token
		claims, err := m.service.VerifyAccessToken(tokenString)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		// TODO: update last_used_at

		// Add token info to context
		ctx := context.WithValue(r.Context(), ContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func extractToken(r *http.Request) string {
	// Try Authorization header
	bearerToken := r.Header.Get("Authorization")

	if len(bearerToken) > 7 && strings.ToUpper(bearerToken[0:6]) == "BEARER" {
		return bearerToken[7:]
	}

	// Try cookie
	cookie, err := r.Cookie("access_token")

	if err == nil && cookie.Value != "" {
		return cookie.Value
	}

	return ""
}
