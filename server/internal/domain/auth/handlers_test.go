package auth_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Fantasy-Programming/nuts/config"
	"github.com/Fantasy-Programming/nuts/internal/domain/auth"
	"github.com/Fantasy-Programming/nuts/internal/domain/user"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/encrypt"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/pkg/pass"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/Fantasy-Programming/nuts/pkg/storage"
	"github.com/docker/go-connections/nat"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
)

type HandlerTestSuite struct {
	suite.Suite
	router       router.Router
	handler      *auth.Handler
	repo         user.Repository
	logger       *zerolog.Logger
	container    *TestPostgresContainer
	dbPool       *pgxpool.Pool
	ctx          context.Context
	userID       uuid.UUID
	jwt          *jwt.Service
	authToken    string
	refreshToken string
}

func (s *HandlerTestSuite) SetupSuite() {
	t := s.T()
	s.ctx = context.Background()

	// Setup logger
	logger := zerolog.New(zerolog.NewConsoleWriter()).With().Timestamp().Logger()
	s.logger = &logger

	// Start PostgreSQL container
	container, err := setupPostgres(s.ctx)
	require.NoError(t, err)
	s.container = container

	// Connect to database
	dbPool, err := pgxpool.New(s.ctx, container.URI)
	require.NoError(t, err)
	s.dbPool = dbPool

	// Initialize schema
	err = initializeSchema(s.ctx, dbPool)
	require.NoError(t, err)

	// Setup JWT config
	jwtConfig := jwt.Config{
		SigningKey:           "LS0tLS1CRUdJTiBFQyBQUklWQVRFIEtFWS0tLS0tCk1IY0NBUUVFSU45WjlOZlcwTnJMOUR2aVgzVXpFek5aSkJ6UzQ3U1J4ZFU4MnJPZnpyZ25vQW9HQ0NxR1NNNDkKQXdFSG9VUURRZ0FFcitTS1hEQ1NORlA3TExUWXVmS1B0eTlGUnU5elFYdk5aSW5TeHN2dkNzOFJOYlZMdXZ1MgpoK2YxdDJFQ1llNFhJUG9YdVVBZHZJdDRpNkFTeHZQVXF3PT0KLS0tLS1FTkQgRUMgUFJJVkFURSBLRVktLS0tLQ==",
		AccessTokenDuration:  15 * time.Minute,
		RefreshTokenDuration: 7 * 24 * time.Hour,
	}

	// Create validator
	validator := validation.New()

	// Create mock token repo
	tokenRepo := jwt.NewMockTokenRepository()

	// Setup JWT service
	s.jwt = jwt.NewService(tokenRepo, jwtConfig, &logger)

	// setup mockStorage

	storage, err := storage.NewStorageProvider(config.Storage{
		Host:   "fs",
		FSPath: "/.tests",
	}, &logger)
	require.NoError(t, err)

	// Create repository
	queries := repository.New(dbPool)
	s.repo = user.NewRepository(dbPool, queries, storage)

	// Create encrypter
	encrypter, err := encrypt.NewEncrypter("a26bfb49e294808885b7cde63663f318bbeefd3117448cd293a44d73bda549c5")
	require.NoError(t, err)

	// Create handler
	s.handler = auth.NewHandler(validator, encrypter, s.jwt, s.repo, &logger)

	// Setup router
	s.router = router.NewRouter()

	// Register validator
	err = auth.RegisterValidations(validator.Validator)
	require.NoError(t, err)
}

func (s *HandlerTestSuite) SetupTest() {
	t := s.T()

	// Clear users table before each test
	_, err := s.dbPool.Exec(s.ctx, "TRUNCATE users CASCADE")
	require.NoError(t, err)

	// Reset router for each test
	s.router = router.NewRouter()
}

func (s *HandlerTestSuite) TearDownSuite() {
	// Close database connection
	s.dbPool.Close()

	// Terminate container
	if s.container != nil {
		err := s.container.Terminate(s.ctx)
		if err != nil {
			s.T().Logf("Failed to terminate container: %v", err)
		}
	}
}

func (s *HandlerTestSuite) makeRequest(method, path string, body interface{}) (*httptest.ResponseRecorder, error) {
	var req *http.Request
	var err error

	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}

		req, err = http.NewRequest(method, path, bytes.NewBuffer(jsonBody))
		if err != nil {
			return nil, err
		}
	} else {
		req, err = http.NewRequest(method, path, nil)
	}

	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")

	// Add auth token as cookie if it exists
	if s.authToken != "" {
		req.AddCookie(&http.Cookie{
			Name:  "access_token",
			Value: s.authToken,
		})
	}

	// Add refresh token as cookie if it exists
	if s.refreshToken != "" {
		req.AddCookie(&http.Cookie{
			Name:  "refresh_token",
			Value: s.refreshToken,
		})
	}

	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)
	return w, nil
}

// Helper to create a user for testing
func (s *HandlerTestSuite) createTestUser(email, password, firstName, lastName string) (uuid.UUID, error) {
	// Hash password
	hashedPassword, err := pass.HashPassword(password, pass.DefaultParams)
	if err != nil {
		return uuid.Nil, err
	}

	// Create user
	var userID uuid.UUID

	err = s.dbPool.QueryRow(s.ctx, `
		INSERT INTO users(email, password, first_name, last_name) 
		VALUES($1, $2, $3, $4)
		RETURNING id
	`, email, string(hashedPassword), firstName, lastName).Scan(&userID)

	return userID, err
}

// Test user signup

func (s *HandlerTestSuite) TestSignup() {
	t := s.T()

	// Register handler
	s.router.Post("/signup", s.handler.Signup)

	// Create signup request
	signupReq := auth.SignupRequest{
		Email:    "new@example.com",
		Password: "Password123!",
	}

	// Send request
	rr, err := s.makeRequest("POST", "/signup", signupReq)
	require.NoError(t, err)

	// Check response
	assert.Equal(t, http.StatusCreated, rr.Code)

	// Check cookies
	cookies := rr.Result().Cookies()
	var accessToken, refreshToken *http.Cookie

	for _, cookie := range cookies {
		switch cookie.Name {
		case "access_token":
			accessToken = cookie
		case "refresh_token":
			refreshToken = cookie
		}
	}

	// We don't expect cookies on signup
	assert.Nil(t, accessToken)
	assert.Nil(t, refreshToken)
}

// Test user signup with invalid data
func (s *HandlerTestSuite) TestSignupInvalidData() {
	t := s.T()

	// Register handler
	s.router.Post("/signup", s.handler.Signup)

	testCases := []struct {
		name     string
		request  auth.SignupRequest
		expected int
	}{
		{
			name: "Empty Email",
			request: auth.SignupRequest{
				Email:    "",
				Password: "Password123!",
			},
			expected: http.StatusBadRequest,
		},
		{
			name: "Invalid Email Format",
			request: auth.SignupRequest{
				Email:    "not-an-email",
				Password: "Password123!",
			},
			expected: http.StatusBadRequest,
		},
		{
			name: "Password Too Short",
			request: auth.SignupRequest{
				Email:    "test@example.com",
				Password: "short",
			},
			expected: http.StatusBadRequest,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Send request
			rr, err := s.makeRequest("POST", "/signup", tc.request)
			require.NoError(t, err)

			// Check response
			assert.Equal(t, tc.expected, rr.Code)
		})
	}
}

// Test user login
func (s *HandlerTestSuite) TestLogin() {
	t := s.T()

	// Register handler
	s.router.Post("/login", s.handler.Login)

	// Create a test user
	password := "Password123!"
	userID, err := s.createTestUser("login@example.com", password, "Login", "User")
	require.NoError(t, err)
	require.NotEqual(t, uuid.Nil, userID)

	// Create login request
	loginReq := auth.LoginRequest{
		Email:    "login@example.com",
		Password: password,
	}

	// Send request
	rr, err := s.makeRequest("POST", "/login", loginReq)
	require.NoError(t, err)

	// Check response
	assert.Equal(t, http.StatusOK, rr.Code)

	// Check cookies
	cookies := rr.Result().Cookies()
	var accessToken, refreshToken *http.Cookie

	for _, cookie := range cookies {
		switch cookie.Name {
		case "access_token":
			accessToken = cookie
		case "refresh_token":
			refreshToken = cookie
		}
	}

	// Verify cookies
	assert.NotNil(t, accessToken)
	assert.NotNil(t, refreshToken)
	assert.NotEmpty(t, accessToken.Value)
	assert.NotEmpty(t, refreshToken.Value)
	assert.True(t, accessToken.HttpOnly)
	assert.True(t, refreshToken.HttpOnly)

	// Save tokens for other tests
	s.authToken = accessToken.Value
	s.refreshToken = refreshToken.Value
	s.userID = userID
}

// Test login with invalid credentials
func (s *HandlerTestSuite) TestLoginInvalidCredentials() {
	t := s.T()

	// Register handler
	s.router.Post("/login", s.handler.Login)

	// Create a test user
	_, err := s.createTestUser("valid@example.com", "Password123!", "Valid", "User")
	require.NoError(t, err)

	testCases := []struct {
		name     string
		request  auth.LoginRequest
		expected int
	}{
		{
			name: "Wrong Password",
			request: auth.LoginRequest{
				Email:    "valid@example.com",
				Password: "WrongPassword123!",
			},
			expected: http.StatusUnauthorized,
		},
		{
			name: "User Not Found",
			request: auth.LoginRequest{
				Email:    "nonexistent@example.com",
				Password: "Password123!",
			},
			expected: http.StatusUnauthorized,
		},
		{
			name: "Empty Email",
			request: auth.LoginRequest{
				Email:    "",
				Password: "Password123!",
			},
			expected: http.StatusBadRequest,
		},
		{
			name: "Empty Password",
			request: auth.LoginRequest{
				Email:    "valid@example.com",
				Password: "",
			},
			expected: http.StatusBadRequest,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Send request
			rr, err := s.makeRequest("POST", "/login", tc.request)
			require.NoError(t, err)

			// Check response
			assert.Equal(t, tc.expected, rr.Code)
		})
	}
}

// Define RefreshRequest to use in testing
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// Test token refresh
func (s *HandlerTestSuite) TestRefresh() {
	t := s.T()

	// We need a valid user and token first
	userID, err := s.createTestUser("refresh@example.com", "Password123!", "Refresh", "User")
	require.NoError(t, err)
	s.userID = userID

	// Generate tokens
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

	tokenPair, err := s.jwt.GenerateTokenPair(context.Background(), sessionInfo)
	require.NoError(t, err)

	originalAccessToken := tokenPair.AccessToken
	originalRefreshToken := tokenPair.RefreshToken

	// Register handler
	s.router.Post("/refresh", s.handler.Refresh)

	// Create mock request with refresh token cookie
	req, err := http.NewRequest("POST", "/refresh", nil)
	require.NoError(t, err)

	req.AddCookie(&http.Cookie{
		Name:  "refresh_token",
		Value: s.refreshToken,
	})

	// Send request
	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	// Check response
	assert.Equal(t, http.StatusOK, w.Code)

	// Check cookies
	cookies := w.Result().Cookies()
	var accessToken, refreshToken *http.Cookie

	for _, cookie := range cookies {
		switch cookie.Name {
		case "access_token":
			accessToken = cookie
		case "refresh_token":
			refreshToken = cookie
		}
	}

	fmt.Println("old_access: ", s.authToken)
	fmt.Println("old_refresh: ", s.refreshToken)
	fmt.Println("access: ", accessToken)
	fmt.Println("refresh: ", refreshToken)

	assert.NotNil(t, accessToken, "Expected new access token")
	assert.NotNil(t, refreshToken, "Expected new refresh token")
	assert.NotEmpty(t, accessToken.Value, "Access token should not be empty")
	assert.NotEmpty(t, refreshToken.Value, "Refresh token should not be empty")
	assert.True(t, accessToken.HttpOnly, "Access token should be HttpOnly")
	assert.True(t, refreshToken.HttpOnly, "Refresh token should be HttpOnly")

	// The main fix: verify the tokens are actually different
	assert.NotEqual(t, originalAccessToken, accessToken.Value, "New access token should be different from original")
	assert.NotEqual(t, originalRefreshToken, refreshToken.Value, "New refresh token should be different from original")
}

// Test refresh with invalid token
func (s *HandlerTestSuite) TestRefreshInvalidToken() {
	t := s.T()

	// Register handler
	s.router.Post("/refresh", s.handler.Refresh)

	// Create mock request with invalid refresh token cookie
	req, err := http.NewRequest("POST", "/refresh", nil)
	require.NoError(t, err)
	req.AddCookie(&http.Cookie{
		Name:  "refresh_token",
		Value: "invalid-refresh-token",
	})

	// Send request
	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	// Check response
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

// Test logout
func (s *HandlerTestSuite) TestLogout() {
	t := s.T()

	// We need a valid user and token first
	if s.userID == uuid.Nil {
		userID, err := s.createTestUser("logout@example.com", "Password123!", "Logout", "User")
		require.NoError(t, err)
		s.userID = userID

		// Generate tokens
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
		tokenPair, err := s.jwt.GenerateTokenPair(context.Background(), sessionInfo)
		require.NoError(t, err)
		s.authToken = tokenPair.AccessToken
		s.refreshToken = tokenPair.RefreshToken
	}

	// Register handler
	s.router.Post("/logout", s.handler.Logout)

	// Create mock request with cookies
	req, err := http.NewRequest("POST", "/logout", nil)
	require.NoError(t, err)
	req.AddCookie(&http.Cookie{
		Name:  "access_token",
		Value: s.authToken,
	})
	req.AddCookie(&http.Cookie{
		Name:  "refresh_token",
		Value: s.refreshToken,
	})

	// Send request
	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	// Check response
	assert.Equal(t, http.StatusOK, w.Code)

	// Check that cookies were properly cleared
	cookies := w.Result().Cookies()
	for _, cookie := range cookies {
		if cookie.Name == "access_token" || cookie.Name == "refresh_token" {
			assert.Equal(t, "", cookie.Value)
			assert.True(t, cookie.Expires.Before(time.Now()))
		}
	}
}

// Helper function to set up test postgres container
func setupPostgres(ctx context.Context) (*TestPostgresContainer, error) {
	ctx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()

	// Define container request
	req := testcontainers.ContainerRequest{
		Image:        "postgres:15-alpine",
		ExposedPorts: []string{"5432/tcp"},
		Env: map[string]string{
			"POSTGRES_USER":     "postgres",
			"POSTGRES_PASSWORD": "postgres",
			"POSTGRES_DB":       "testdb",
		},
		WaitingFor: wait.ForAll(
			wait.ForListeningPort("5432/tcp"),
		),
	}

	// Start container
	container, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to start container: %w", err)
	}

	// Get mapped port with retry logic
	var mappedPort nat.Port
	for attempt := 0; attempt < 3; attempt++ {
		mappedPort, err = container.MappedPort(ctx, "5432")
		if err == nil {
			break
		}
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get mapped port after multiple attempts: %w", err)
	}

	// Get host
	host, err := container.Host(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get container host: %w", err)
	}

	// Construct connection URI
	uri := fmt.Sprintf("postgres://postgres:postgres@%s:%s/testdb?sslmode=disable", host, mappedPort.Port())

	// Verify database connection
	conn, err := pgxpool.New(ctx, uri)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}
	defer conn.Close()

	// Ping the database
	if err := conn.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &TestPostgresContainer{
		Container: container,
		URI:       uri,
	}, nil
}

// TestPostgresContainer wraps a postgres container with its connection URI
type TestPostgresContainer struct {
	Container testcontainers.Container
	URI       string
}

// Terminate stops and removes the container
func (c *TestPostgresContainer) Terminate(ctx context.Context) error {
	return c.Container.Terminate(ctx)
}

// Initialize schema loads test schema into database
func initializeSchema(ctx context.Context, db *pgxpool.Pool) error {
	// Basic schema for testing
	schema := `
	CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

	CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		email VARCHAR(255) UNIQUE NOT NULL,
		password VARCHAR(255) NOT NULL,
		first_name VARCHAR(255),
		last_name VARCHAR(255),
    avatar_url VARCHAR,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
	);
	
	-- Create tokens table for refresh tokens
	CREATE TABLE IF NOT EXISTS tokens (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		refresh_token VARCHAR(255) NOT NULL,
	  expires_at TIMESTAMPTZ NOT NULL,
		last_used_at TIMESTAMP NOT NULL,
		UNIQUE(user_id, refresh_token)
	);

	-- Create Cateogries table for default category cration

	CREATE TABLE IF NOT EXISTS categories (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		name VARCHAR(255) NOT NULL,
    parent_id UUID DEFAULT NULL,
    is_default BOOLEAN DEFAULT FALSE,
		description TEXT,
		color VARCHAR(20),
		icon VARCHAR(50),
		created_by UUID REFERENCES users(id),
		updated_by UUID REFERENCES users(id),
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
	);
	`

	_, err := db.Exec(ctx, schema)
	if err != nil {
		return fmt.Errorf("failed to initialize schema: %w", err)
	}

	return nil
}

// TestMain to run the test suite
func TestAuthHandlers(t *testing.T) {
	suite.Run(t, new(HandlerTestSuite))
}
