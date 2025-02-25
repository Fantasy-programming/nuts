package jwt

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGenerateToken(t *testing.T) {
	tests := []struct {
		name     string
		userID   uuid.UUID
		roles    []string
		key      string
		duration time.Duration
		wantErr  bool
	}{
		{
			name:     "valid token",
			userID:   uuid.New(),
			roles:    []string{"user"},
			key:      "secret",
			duration: time.Hour,
			wantErr:  false,
		},
		{
			name:     "empty key",
			userID:   uuid.New(),
			roles:    []string{"user"},
			key:      "",
			duration: time.Hour,
			wantErr:  true,
		},
		{
			name:     "empty roles",
			userID:   uuid.New(),
			roles:    []string{},
			key:      "secret",
			duration: time.Hour,
			wantErr:  true,
		},
		{
			name:     "nil UUID",
			userID:   uuid.Nil,
			roles:    []string{"user"},
			key:      "secret",
			duration: time.Hour,
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token, err := GenerateToken(tt.userID, tt.roles, tt.key, tt.duration)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Empty(t, token)
			} else {
				assert.NoError(t, err)
				assert.NotEmpty(t, token)
			}
		})
	}
}

func TestVerifyToken(t *testing.T) {
	key := "test-secret"
	userID := uuid.New()
	roles := []string{"user"}
	duration := time.Hour

	token, err := GenerateToken(userID, roles, key, duration)
	require.NoError(t, err)

	tests := []struct {
		name    string
		token   string
		key     string
		wantErr bool
	}{
		{
			name:    "valid token",
			token:   token,
			key:     key,
			wantErr: false,
		},
		{
			name:    "invalid key",
			token:   token,
			key:     "wrong-key",
			wantErr: true,
		},
		{
			name:    "empty key",
			token:   token,
			key:     "",
			wantErr: true,
		},
		{
			name:    "invalid token format",
			token:   "invalid.token",
			key:     key,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			claims, err := VerifyToken(tt.token, tt.key)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, claims)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, userID, claims.UserID)
				assert.Equal(t, roles, claims.Roles)
			}
		})
	}
}

func TestSplitAndReconstructJWT(t *testing.T) {
	key := "test-secret"
	userID := uuid.New()
	roles := []string{"user"}
	duration := time.Hour

	originalToken, err := GenerateToken(userID, roles, key, duration)
	require.NoError(t, err)

	// Test splitting
	headerPayload, signature, err := SplitJWT(originalToken)
	require.NoError(t, err)
	assert.NotEmpty(t, headerPayload)
	assert.NotEmpty(t, signature)

	// Test reconstruction
	reconstructedToken, err := ReconstructJWT(headerPayload, signature)
	require.NoError(t, err)
	assert.Equal(t, originalToken, reconstructedToken)

	// Test invalid split cases
	_, _, err = SplitJWT("invalid.token")
	assert.Error(t, err)

	// Test invalid reconstruction cases
	_, err = ReconstructJWT("", signature)
	assert.Error(t, err)
	_, err = ReconstructJWT(headerPayload, "")
	assert.Error(t, err)
}
