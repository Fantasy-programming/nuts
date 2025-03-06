package jwt

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

type TokenService struct {
	queries    *repository.Queries
	signingKey string
	logger     *zerolog.Logger
}

type TokenPair struct {
	AccessToken  string
	RefreshToken string
}

type StoredToken struct {
	ID           uuid.UUID
	UserID       uuid.UUID
	RefreshToken string
	ExpiresAt    time.Time
	LastUsedAt   time.Time
}

var (
	ErrUnauthorized     = errors.New("unauthorized")
	ErrTokenExpired     = errors.New("token expired")
	ErrInvalidToken     = errors.New("invalid token")
	ErrNoTokenFound     = errors.New("no token found")
	ErrFailedTokenGen   = errors.New("failed to generate token")
	ErrFailedTokenStore = errors.New("failed to store token")
)

var ContextKey = "user"

func NewTokenService(db *pgxpool.Pool, signingKey string, logger *zerolog.Logger) *TokenService {
	queries := repository.New(db)

	return &TokenService{
		queries:    queries,
		signingKey: signingKey,
		logger:     logger,
	}
}

// GenerateTokenPair creates access and refresh tokens
func (ts *TokenService) GenerateTokenPair(userID uuid.UUID, roles []string) (*TokenPair, error) {
	ctx := context.Background()

	// Access token (short-lived)
	accessToken, err := ts.generateAccessToken(userID, roles)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	// Refresh token (long-lived)
	refreshToken, err := ts.generateRefreshToken(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Store refresh token in database
	err = ts.storeRefreshToken(ctx, userID, refreshToken)
	if err != nil {
		return nil, fmt.Errorf("failed to store refresh token: %w", err)
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

// generateAccessToken creates a short-lived access token
func (ts *TokenService) generateAccessToken(userID uuid.UUID, roles []string) (string, error) {
	claims := jwt.MapClaims{
		"id":    userID.String(),
		"roles": roles,
		"exp":   time.Now().Add(15 * time.Minute).Unix(),
		"iat":   time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(ts.signingKey))
}

// generateRefreshToken creates a long-lived refresh token
func (ts *TokenService) generateRefreshToken(userID uuid.UUID) (string, error) {
	claims := jwt.MapClaims{
		"id":  userID.String(),
		"exp": time.Now().Add(7 * 24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(ts.signingKey))
}

// storeRefreshToken stores the refresh token in the database
func (ts *TokenService) storeRefreshToken(ctx context.Context, userID uuid.UUID, refreshToken string) error {
	// First, clean up any expired tokens for this user

	err := ts.queries.DeleteExpiredTokens(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to clean up expired tokens: %w", err)
	}

	err = ts.queries.SaveUserToken(ctx, repository.SaveUserTokenParams{
		UserID:       userID,
		RefreshToken: refreshToken,
		ExpiresAt:    time.Now().Add(7 * 24 * time.Hour),
	})
	if err != nil {
		return fmt.Errorf("failed to store refresh token: %w", err)
	}

	return nil
}

// RefreshAccessToken handles token refresh logic
func (ts *TokenService) RefreshAccessToken(ctx context.Context, refreshToken string) (*TokenPair, error) {
	// Verify refresh token
	token, err := jwt.Parse(refreshToken, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(ts.signingKey), nil
	})
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token: %w", err)
	}

	// Extract user ID from token
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, ErrInvalidToken
	}

	userIDStr, ok := claims["id"].(string)
	if !ok {
		return nil, ErrInvalidToken
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, ErrInvalidToken
	}

	val, err := ts.queries.GetRefreshToken(ctx, repository.GetRefreshTokenParams{
		UserID:       userID,
		RefreshToken: refreshToken,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrUnauthorized
		}
		return nil, fmt.Errorf("failed to validate token: %w", err)
	}

	err = ts.queries.UpdateTokenTimeSTamp(ctx, val.ID)
	if err != nil {
		ts.logger.Printf("Failed to update token last used time: %v", err)
	}

	// Generate new token pair
	return ts.GenerateTokenPair(userID, []string{"user"})
}

// InvalidateTokens removes all tokens for a user
func (ts *TokenService) InvalidateTokens(ctx context.Context, userID uuid.UUID) error {
	err := ts.queries.DeleteUserToken(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to invalidate tokens: %w", err)
	}

	return nil
}

// Middleware for token verification
func (ts *TokenService) Verify(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract token from request
		tokenString := extractToken(r)
		if tokenString == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Verify token
		token, err := ts.verifyAccessToken(tokenString)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		// Add token info to context
		ctx := context.WithValue(r.Context(), ContextKey, token.Claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// verifyAccessToken validates the access token
func (ts *TokenService) verifyAccessToken(tokenString string) (*jwt.Token, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(ts.signingKey), nil
	})
	if err != nil {
		return nil, ErrInvalidToken
	}

	if !token.Valid {
		return nil, ErrUnauthorized
	}

	return token, nil
}

// Helper function to extract token from request
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

func GetID(r *http.Request) (uuid.UUID, error) {
	ctx := r.Context()
	claims, _ := ctx.Value(ContextKey).(jwt.MapClaims)

	idStr := claims["id"].(string)

	return uuid.Parse(idStr)
}
