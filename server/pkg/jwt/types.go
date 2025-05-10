package jwt

import (
	"context"
	"time"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

// TokenRepository defines the interface for token storage
type TokenRepository interface {
	SaveToken(ctx context.Context, session SessionInfo, refreshToken string, expiresAt time.Time) error
	UpdateTokenLastUsed(ctx context.Context, tokenID uuid.UUID) error

	GetToken(ctx context.Context, userID uuid.UUID, refreshToken string) (TokenInfo, error)
	GetTokens(ctx context.Context, userID uuid.UUID) ([]repository.GetSessionsRow, error)

	DeleteExpiredTokens(ctx context.Context, userID uuid.UUID) error
	DeleteUserTokens(ctx context.Context, userID uuid.UUID) error
	RevokeToken(ctx context.Context, tokenID uuid.UUID) error
}

// TokenType represents different token types
type TokenType string

// Config holds JWT configuration
type Config struct {
	AccessTokenDuration  time.Duration
	RefreshTokenDuration time.Duration
	SigningKey           string
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

type FullToken struct {
	ID         uuid.UUID
	LastUsedAt time.Time
}

// Service manages JWT token operations
type Service struct {
	repo   TokenRepository
	config Config
	logger *zerolog.Logger
}

type SessionInfo struct {
	UserID      uuid.UUID
	Roles       []string
	UserAgent   *string
	IpAddress   *string
	Location    *string
	BrowserName *string
	DeviceName  *string
	OsName      *string
}
