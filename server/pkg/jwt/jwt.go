package jwt

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

var (
	ErrUnauthorized     = errors.New("unauthorized")
	ErrTokenExpired     = errors.New("token expired")
	ErrInvalidToken     = errors.New("invalid token")
	ErrNoTokenFound     = errors.New("no token found")
	ErrFailedTokenGen   = errors.New("failed to generate token")
	ErrFailedTokenStore = errors.New("failed to store token")
)

type AuthContextKey string

// Store user information in the request context
var ContextKey AuthContextKey = "user"

const (
	AccessToken  TokenType = "access"
	RefreshToken TokenType = "refresh"
)

// DefaultConfig returns a default configuration
func DefaultConfig() Config {
	return Config{
		AccessTokenDuration:  15 * time.Minute,
		RefreshTokenDuration: 7 * 24 * time.Hour,
		SigningKey:           "default-signing-key", // Should be overridden
	}
}

// NewService creates a new token service
func NewService(repo TokenRepository, config Config, logger *zerolog.Logger) *Service {
	return &Service{
		repo:   repo,
		config: config,
		logger: logger,
	}
}

// GenerateTokenPair creates new access and refresh tokens
func (s *Service) GenerateTokenPair(ctx context.Context, sessionInfo SessionInfo) (*TokenPair, error) {
	accessToken, err := s.generateToken(
		sessionInfo.UserID,
		sessionInfo.Roles,
		AccessToken)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := s.generateToken(
		sessionInfo.UserID,
		sessionInfo.Roles,
		RefreshToken)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	err = s.StoreRefreshToken(ctx, sessionInfo, refreshToken)
	if err != nil {
		return nil, fmt.Errorf("failed to store refresh token: %w", err)
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

// storeRefreshToken saves the refresh token to the repository
func (s *Service) StoreRefreshToken(ctx context.Context, session SessionInfo, refreshToken string) error {
	// TODO: Move to a job (Delete expired user tokens)
	if err := s.repo.DeleteExpiredTokens(ctx, session.UserID); err != nil {
		s.logger.Err(err).Msg("failed to clean up expired tokens")
	}

	expiresAt := time.Now().Add(s.config.RefreshTokenDuration)

	if err := s.repo.SaveToken(ctx, session, refreshToken, expiresAt); err != nil {
		return ErrFailedTokenStore
	}

	return nil
}

// RefreshAccessToken validates a refresh token and issues a new token pair
func (s *Service) RefreshAccessToken(ctx context.Context, session SessionInfo, refreshToken string) (*TokenPair, error) {
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

	// Revoke Old Token
	if err := s.repo.RevokeToken(ctx, tokenInfo.ID); err != nil {
		s.logger.Err(err).Msg("failed to remove last used token")
	}

	session.UserID = userID

	// Generate new token pair
	return s.GenerateTokenPair(ctx, session)
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

func (s *Service) GetSessions(ctx context.Context, userID uuid.UUID) ([]repository.GetSessionsRow, error) {
	return s.repo.GetTokens(ctx, userID)
}

func (s *Service) RevokeSessions(ctx context.Context, id uuid.UUID) error {
	return s.repo.RevokeToken(ctx, id)
}

func (s *Service) InvalidateTokens(ctx context.Context, userID uuid.UUID) error {
	return s.repo.DeleteUserTokens(ctx, userID)
}

// generateToken creates a new JWT token
func (s *Service) generateToken(userID uuid.UUID, roles []string, tokenType TokenType) (string, error) {
	claims := jwt.MapClaims{
		"id":        userID.String(),
		"tokenType": string(tokenType),
		"iat":       time.Now().Unix(),
		"jti":       uuid.New().String(),
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

// parseToken validates and parses a JWT token
func (s *Service) parseToken(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
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
