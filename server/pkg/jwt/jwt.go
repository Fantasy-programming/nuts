package jwt

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Errors
var (
	ErrUnauthorized     = errors.New("unauthorized")
	ErrTokenExpired     = errors.New("token expired")
	ErrInvalidToken     = errors.New("invalid token")
	ErrNoTokenFound     = errors.New("no token found")
	ErrFailedTokenGen   = errors.New("failed to generate token")
	ErrFailedTokenStore = errors.New("failed to store token")
)

// ContextKey is used to store user information in the request context
var ContextKey = "user"

// TokenType represents different token types
type TokenType string

const (
	AccessToken  TokenType = "access"
	RefreshToken TokenType = "refresh"
)

// Config holds JWT configuration
type Config struct {
	AccessTokenDuration  time.Duration
	RefreshTokenDuration time.Duration
	SigningKey           string
}

// DefaultConfig returns a default configuration
func DefaultConfig() Config {
	return Config{
		AccessTokenDuration:  15 * time.Minute,
		RefreshTokenDuration: 7 * 24 * time.Hour,
		SigningKey:           "default-signing-key", // Should be overridden
	}
}

// TokenPair contains access and refresh tokens
type TokenPair struct {
	AccessToken  string
	RefreshToken string
}

// TokenInfo represents a stored token
type TokenInfo struct {
	ID           uuid.UUID
	UserID       uuid.UUID
	RefreshToken string
	ExpiresAt    time.Time
	LastUsedAt   time.Time
}

// TokenRepository defines the interface for token storage
type TokenRepository interface {
	SaveToken(ctx context.Context, userID uuid.UUID, refreshToken string, expiresAt time.Time) error
	GetToken(ctx context.Context, userID uuid.UUID, refreshToken string) (TokenInfo, error)
	DeleteExpiredTokens(ctx context.Context, userID uuid.UUID) error
	UpdateTokenLastUsed(ctx context.Context, tokenID uuid.UUID) error
	DeleteUserTokens(ctx context.Context, userID uuid.UUID) error
}

// Logger defines a minimal logging interface
type Logger interface {
	Error(msg string, err error)
	Info(msg string, args ...interface{})
}

// Service manages JWT token operations
type Service struct {
	repo   TokenRepository
	config Config
	logger Logger
}

// NewService creates a new token service
func NewService(repo TokenRepository, config Config, logger Logger) *Service {
	return &Service{
		repo:   repo,
		config: config,
		logger: logger,
	}
}

// GenerateTokenPair creates new access and refresh tokens
func (s *Service) GenerateTokenPair(ctx context.Context, userID uuid.UUID, roles []string) (*TokenPair, error) {
	// Generate access token
	accessToken, err := s.generateToken(userID, roles, AccessToken)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	// Generate refresh token
	refreshToken, err := s.generateToken(userID, nil, RefreshToken)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Store refresh token
	if err := s.storeRefreshToken(ctx, userID, refreshToken); err != nil {
		return nil, fmt.Errorf("failed to store refresh token: %w", err)
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

// generateToken creates a new JWT token
func (s *Service) generateToken(userID uuid.UUID, roles []string, tokenType TokenType) (string, error) {
	claims := jwt.MapClaims{
		"id":        userID.String(),
		"tokenType": string(tokenType),
		"iat":       time.Now().Unix(),
	}

	var expiration time.Duration

	switch tokenType {
	case AccessToken:
		claims["roles"] = roles
		expiration = s.config.AccessTokenDuration
	case RefreshToken:
		expiration = s.config.RefreshTokenDuration
	}

	claims["exp"] = time.Now().Add(expiration).Unix()

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.config.SigningKey))
}

// storeRefreshToken saves the refresh token to the repository
func (s *Service) storeRefreshToken(ctx context.Context, userID uuid.UUID, refreshToken string) error {
	// Clean up expired tokens first
	if err := s.repo.DeleteExpiredTokens(ctx, userID); err != nil {
		s.logger.Error("failed to clean up expired tokens", err)
		// Continue despite error
	}

	expiresAt := time.Now().Add(s.config.RefreshTokenDuration)
	if err := s.repo.SaveToken(ctx, userID, refreshToken, expiresAt); err != nil {
		return ErrFailedTokenStore
	}

	return nil
}

// RefreshAccessToken validates a refresh token and issues a new token pair
func (s *Service) RefreshAccessToken(ctx context.Context, refreshToken string) (*TokenPair, error) {
	// Parse and validate token
	claims, err := s.parseToken(refreshToken)
	if err != nil {
		return nil, err
	}

	// Verify it's a refresh token
	tokenType, ok := claims["tokenType"].(string)
	if !ok || tokenType != string(RefreshToken) {
		return nil, ErrInvalidToken
	}

	// Extract user ID
	userIDStr, ok := claims["id"].(string)
	if !ok {
		return nil, ErrInvalidToken
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, ErrInvalidToken
	}

	// Verify token exists in database
	tokenInfo, err := s.repo.GetToken(ctx, userID, refreshToken)
	if err != nil {
		return nil, ErrUnauthorized
	}

	// Update last used timestamp
	if err := s.repo.UpdateTokenLastUsed(ctx, tokenInfo.ID); err != nil {
		s.logger.Error("failed to update token last used time", err)
		// Continue despite error
	}

	// Generate new token pair
	return s.GenerateTokenPair(ctx, userID, []string{"user"})
}

// InvalidateTokens removes all tokens for a user
func (s *Service) InvalidateTokens(ctx context.Context, userID uuid.UUID) error {
	if err := s.repo.DeleteUserTokens(ctx, userID); err != nil {
		return fmt.Errorf("failed to invalidate tokens: %w", err)
	}
	return nil
}

// parseToken validates and parses a JWT token
func (s *Service) parseToken(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.config.SigningKey), nil
	})
	if err != nil {
		return nil, ErrInvalidToken
	}

	if !token.Valid {
		return nil, ErrUnauthorized
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// VerifyAccessToken validates an access token and returns its claims
func (s *Service) VerifyAccessToken(tokenString string) (jwt.MapClaims, error) {
	claims, err := s.parseToken(tokenString)
	if err != nil {
		return nil, err
	}

	// Verify it's an access token
	tokenType, ok := claims["tokenType"].(string)
	if !ok || tokenType != string(AccessToken) {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// Middleware provides HTTP middleware for JWT authentication
type Middleware struct {
	service *Service
}

// NewMiddleware creates a new JWT middleware
func NewMiddleware(service *Service) *Middleware {
	return &Middleware{
		service: service,
	}
}

// Verify authenticates requests using JWT tokens
func (m *Middleware) Verify(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract token from request
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

		// Add token info to context
		ctx := context.WithValue(r.Context(), ContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Helper functions

// ExtractToken gets token from request headers or cookies
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

// GetUserID extracts user ID from request context
func GetUserID(r *http.Request) (uuid.UUID, error) {
	ctx := r.Context()
	claims, ok := ctx.Value(ContextKey).(jwt.MapClaims)
	if !ok {
		return uuid.Nil, ErrNoTokenFound
	}

	idStr, ok := claims["id"].(string)
	if !ok {
		return uuid.Nil, ErrInvalidToken
	}

	return uuid.Parse(idStr)
}
