package jwt

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// MockTokenRepository implements TokenRepository for testing
type MockTokenRepository struct {
	tokens map[string]TokenInfo
}

// NewMockTokenRepository creates a new mock repository
func NewMockTokenRepository() *MockTokenRepository {
	return &MockTokenRepository{
		tokens: make(map[string]TokenInfo),
	}
}

// SaveToken stores a token in the mock repository
func (m *MockTokenRepository) SaveToken(ctx context.Context, userID uuid.UUID, refreshToken string, expiresAt time.Time) error {
	tokenID := uuid.New()
	m.tokens[refreshToken] = TokenInfo{
		ID:           tokenID,
		UserID:       userID,
		RefreshToken: refreshToken,
		ExpiresAt:    expiresAt,
		LastUsedAt:   time.Now(),
	}
	return nil
}

// GetToken retrieves a token from the mock repository
func (m *MockTokenRepository) GetToken(ctx context.Context, userID uuid.UUID, refreshToken string) (TokenInfo, error) {
	token, exists := m.tokens[refreshToken]
	if !exists {
		return TokenInfo{}, errors.New("token not found")
	}

	if token.UserID != userID {
		return TokenInfo{}, errors.New("user ID mismatch")
	}

	if token.ExpiresAt.Before(time.Now()) {
		return TokenInfo{}, errors.New("token expired")
	}

	return token, nil
}

// DeleteExpiredTokens removes expired tokens from the mock repository
func (m *MockTokenRepository) DeleteExpiredTokens(ctx context.Context, userID uuid.UUID) error {
	now := time.Now()
	for key, token := range m.tokens {
		if token.UserID == userID && token.ExpiresAt.Before(now) {
			delete(m.tokens, key)
		}
	}
	return nil
}

// UpdateTokenLastUsed updates the last used timestamp of a token
func (m *MockTokenRepository) UpdateTokenLastUsed(ctx context.Context, tokenID uuid.UUID) error {
	for key, token := range m.tokens {
		if token.ID == tokenID {
			token.LastUsedAt = time.Now()
			m.tokens[key] = token
			return nil
		}
	}
	return errors.New("token not found")
}

// DeleteUserTokens removes all tokens for a user
func (m *MockTokenRepository) DeleteUserTokens(ctx context.Context, userID uuid.UUID) error {
	for key, token := range m.tokens {
		if token.UserID == userID {
			delete(m.tokens, key)
		}
	}
	return nil
}

// Mock logger

// MockLogger implements the Logger interface for testing
type MockLogger struct {
	Logs []string
}

// NewMockLogger creates a new mock logger
func NewMockLogger() *MockLogger {
	return &MockLogger{
		Logs: make([]string, 0),
	}
}

// Error logs an error message
func (m *MockLogger) Error(msg string, err error) {
	logMsg := fmt.Sprintf("ERROR: %s - %v", msg, err)
	m.Logs = append(m.Logs, logMsg)
}

// Info logs an informational message
func (m *MockLogger) Info(msg string, args ...interface{}) {
	logMsg := fmt.Sprintf("INFO: %s - %v", msg, args)
	m.Logs = append(m.Logs, logMsg)
}
