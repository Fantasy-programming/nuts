package jwt_test

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	ogJwt "github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTest() (*jwt.Service, *jwt.MockTokenRepository, *zerolog.Logger) {
	repo := jwt.NewMockTokenRepository()
	logger := zerolog.New(nil)

	config := jwt.Config{
		AccessTokenDuration:  15 * time.Minute,
		RefreshTokenDuration: 24 * time.Hour,
		SigningKey:           "test-signing-key",
	}

	service := jwt.NewService(repo, config, &logger)
	return service, repo, &logger
}

func TestGenerateTokenPair(t *testing.T) {
	// Setup
	service, _, _ := setupTest()
	ctx := context.Background()
	userID := uuid.New()
	roles := []string{"user", "admin"}
	userAgent := "this is a user agent"
	ip := "127.0.0.0"
	location := "canada"
	browser_name := "chrome"
	device_name := "desktop"
	osName := "windows"

	sessionInfo := jwt.SessionInfo{
		UserID:      userID,
		UserAgent:   &userAgent,
		Roles:       roles,
		IpAddress:   &ip,
		Location:    &location,
		BrowserName: &browser_name,
		DeviceName:  &device_name,
		OsName:      &osName,
	}

	// Test
	tokenPair, err := service.GenerateTokenPair(ctx, sessionInfo)

	// Assert
	require.NoError(t, err)
	assert.NotEmpty(t, tokenPair.AccessToken)
	assert.NotEmpty(t, tokenPair.RefreshToken)

	// Verify access token
	token, err := ogJwt.Parse(tokenPair.AccessToken, func(token *ogJwt.Token) (interface{}, error) {
		return []byte("test-signing-key"), nil
	})
	require.NoError(t, err)
	require.True(t, token.Valid)

	claims, ok := token.Claims.(ogJwt.MapClaims)
	require.True(t, ok)
	assert.Equal(t, userID.String(), claims["id"])
	assert.Equal(t, "access", claims["tokenType"])

	// Check roles
	tokenRoles, ok := claims["roles"].([]interface{})
	require.True(t, ok)
	assert.Len(t, tokenRoles, 2)
	assert.Equal(t, "user", tokenRoles[0])
	assert.Equal(t, "admin", tokenRoles[1])
}

func TestRefreshAccessToken(t *testing.T) {
	// Setup
	service, _, _ := setupTest()
	ctx := context.Background()
	userID := uuid.New()
	roles := []string{"user"}
	userAgent := "this is a user agent"
	ip := "127.0.0.0"
	location := "canada"
	browser_name := "chrome"
	device_name := "desktop"
	osName := "windows"

	sessionInfo := jwt.SessionInfo{
		UserID:      userID,
		UserAgent:   &userAgent,
		Roles:       roles,
		IpAddress:   &ip,
		Location:    &location,
		BrowserName: &browser_name,
		DeviceName:  &device_name,
		OsName:      &osName,
	}

	// Generate initial token pair
	initialTokens, err := service.GenerateTokenPair(ctx, sessionInfo)

	fmt.Println("initial iD: ", userID)

	require.NoError(t, err)

	// Test refresh
	newTokens, err := service.RefreshAccessToken(ctx, sessionInfo, initialTokens.RefreshToken)

	require.NoError(t, err)

	// Assert
	assert.NotEmpty(t, newTokens.AccessToken)
	assert.NotEmpty(t, newTokens.RefreshToken)
	assert.NotEqual(t, initialTokens.AccessToken, newTokens.AccessToken)
	assert.NotEqual(t, initialTokens.RefreshToken, newTokens.RefreshToken)
}

func TestInvalidateTokens(t *testing.T) {
	// Setup
	service, repo, _ := setupTest()
	ctx := context.Background()
	userID := uuid.New()
	roles := []string{"user"}
	userAgent := "this is a user agent"
	ip := "127.0.0.0"
	location := "canada"
	browser_name := "chrome"
	device_name := "desktop"
	osName := "windows"

	sessionInfo := jwt.SessionInfo{
		UserID:      userID,
		UserAgent:   &userAgent,
		Roles:       roles,
		IpAddress:   &ip,
		Location:    &location,
		BrowserName: &browser_name,
		DeviceName:  &device_name,
		OsName:      &osName,
	}
	// Generate token pair
	initialTokens, err := service.GenerateTokenPair(ctx, sessionInfo)
	require.NoError(t, err)

	// Verify refresh token exists
	_, err = repo.GetToken(ctx, userID, initialTokens.RefreshToken)
	require.NoError(t, err)

	// Test invalidation
	err = service.InvalidateTokens(ctx, userID)
	require.NoError(t, err)

	// Verify tokens are invalidated
	_, err = repo.GetToken(ctx, userID, initialTokens.RefreshToken)
	assert.Error(t, err)
}

func TestMiddleware(t *testing.T) {
	// Setup
	service, _, _ := setupTest()
	middleware := jwt.NewMiddleware(service)
	ctx := context.Background()
	userID := uuid.New()
	roles := []string{"user"}
	userAgent := "this is a user agent"
	ip := "127.0.0.0"
	location := "canada"
	browser_name := "chrome"
	device_name := "desktop"
	osName := "windows"

	sessionInfo := jwt.SessionInfo{
		UserID:      userID,
		UserAgent:   &userAgent,
		Roles:       roles,
		IpAddress:   &ip,
		Location:    &location,
		BrowserName: &browser_name,
		DeviceName:  &device_name,
		OsName:      &osName,
	}
	// Generate token pair
	tokenPair, err := service.GenerateTokenPair(ctx, sessionInfo)
	require.NoError(t, err)

	// Create test handler
	nextCalled := false
	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		nextCalled = true
		// Verify user context is set
		extractedID, err := jwt.GetUserID(r)
		assert.NoError(t, err)
		assert.Equal(t, userID, extractedID)
	})

	// Create test request with token
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+tokenPair.AccessToken)
	w := httptest.NewRecorder()

	// Test middleware
	handler := middleware.Verify(nextHandler)
	handler.ServeHTTP(w, req)

	// Assert
	assert.True(t, nextCalled)
	assert.Equal(t, http.StatusOK, w.Code)

	// Test invalid token
	nextCalled = false
	req = httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer invalid-token")
	w = httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	// Assert
	assert.False(t, nextCalled)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestTokenExpiration(t *testing.T) {
	// Setup custom config with short expiration
	repo := jwt.NewMockTokenRepository()
	logger := zerolog.New(nil)

	config := jwt.Config{
		AccessTokenDuration:  1 * time.Millisecond, // Very short for testing
		RefreshTokenDuration: 10 * time.Millisecond,
		SigningKey:           "test-signing-key",
	}

	service := jwt.NewService(repo, config, &logger)

	ctx := context.Background()
	userID := uuid.New()
	roles := []string{"user"}
	userAgent := "this is a user agent"
	ip := "127.0.0.0"
	location := "canada"
	browser_name := "chrome"
	device_name := "desktop"
	osName := "windows"

	sessionInfo := jwt.SessionInfo{
		UserID:      userID,
		UserAgent:   &userAgent,
		Roles:       roles,
		IpAddress:   &ip,
		Location:    &location,
		BrowserName: &browser_name,
		DeviceName:  &device_name,
		OsName:      &osName,
	}

	// Generate token pair
	tokenPair, err := service.GenerateTokenPair(ctx, sessionInfo)
	require.NoError(t, err)

	// Wait for token to expire
	time.Sleep(5 * time.Millisecond)

	// Try to verify the expired access token
	_, err = service.VerifyAccessToken(tokenPair.AccessToken)
	assert.Error(t, err)

	// Generate new tokens and wait for refresh token to expire
	tokenPair, err = service.GenerateTokenPair(ctx, sessionInfo)
	require.NoError(t, err)

	// Wait for refresh token to expire
	time.Sleep(15 * time.Millisecond)

	// Try to refresh with expired token
	_, err = service.RefreshAccessToken(ctx, sessionInfo, tokenPair.RefreshToken)
	assert.Error(t, err)
}
