package jwt

import (
	"context"
	"errors"
	"time"

	"github.com/Fantasy-Programming/nuts/internal/repository"
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
func (m *MockTokenRepository) SaveToken(ctx context.Context, session SessionInfo, refreshToken string, expiresAt time.Time) error {
	tokenID := uuid.New()

	m.tokens[refreshToken] = TokenInfo{
		ID:           tokenID,
		UserID:       session.UserID,
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
		delete(m.tokens, refreshToken)
		return TokenInfo{}, errors.New("token expired")
	}

	// Delete the token after getting it
	delete(m.tokens, refreshToken)

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

func (m *MockTokenRepository) GetTokens(ctx context.Context, userID uuid.UUID) ([]repository.GetSessionsRow, error) {
	var userTokens []repository.GetSessionsRow
	for _, token := range m.tokens {
		if token.UserID == userID {
			// Convert TokenInfo to repository.GetSessionsRow
			// This might need adjustment based on the actual GetSessionsRow struct fields
			sessionRow := repository.GetSessionsRow{
				ID:         token.ID,
				LastUsedAt: token.LastUsedAt,
				// RefreshToken: token.RefreshToken,
			}
			userTokens = append(userTokens, sessionRow)
		}
	}
	if len(userTokens) == 0 {
		// To mimic sqlc behavior when no rows are found, though for a list, an empty slice is often fine.
		// return nil, pgx.ErrNoRows // Or just return the empty slice and nil error
	}
	return userTokens, nil
}

func (m *MockTokenRepository) RevokeToken(ctx context.Context, id uuid.UUID) error {
	for key, token := range m.tokens {
		if token.ID == id {
			delete(m.tokens, key)
			return nil
		}
	}

	// To mimic sqlc behavior when no row is affected/found for deletion
	return errors.New("token not found for removal") // Or return nil if you prefer idempotent deletes
}
