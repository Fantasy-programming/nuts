package accounts_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Fantasy-Programming/nuts/internal/domain/accounts"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/types"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/docker/go-connections/nat"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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
	handler      *accounts.Handler
	repo         accounts.Repository
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

	// Create test user
	s.userID = uuid.New()

	_, err = dbPool.Exec(s.ctx, `
		INSERT INTO users(id, email, password, first_name, last_name)
		VALUES($1, 'test@example.com', 'password123', 'Test', 'User')
	`, s.userID)

	require.NoError(t, err)

	queries := repository.New(dbPool)
	err = queries.CreateDefaultCategories(s.ctx, s.userID)

	require.NoError(t, err)

	fmt.Println("yes")

	repo := jwt.NewMockTokenRepository()

	// Setup JWT config
	jwtConfig := jwt.Config{
		SigningKey:           "LS0tLS1CRUdJTiBFQyBQUklWQVRFIEtFWS0tLS0tCk1IY0NBUUVFSU45WjlOZlcwTnJMOUR2aVgzVXpFek5aSkJ6UzQ3U1J4ZFU4MnJPZnpyZ25vQW9HQ0NxR1NNNDkKQXdFSG9VUURRZ0FFcitTS1hEQ1NORlA3TExUWXVmS1B0eTlGUnU5elFYdk5aSW5TeHN2dkNzOFJOYlZMdXZ1MgpoK2YxdDJFQ1llNFhJUG9YdVVBZHZJdDRpNkFTeHZQVXF3PT0KLS0tLS1FTkQgRUMgUFJJVkFURSBLRVktLS0tLQ==",
		AccessTokenDuration:  15 * time.Minute,
		RefreshTokenDuration: 7 * 24 * time.Hour,
	}

	s.jwt = jwt.NewService(repo, jwtConfig, &logger)

	// Create JWT tokens for test user
	roles := []string{"user"}
	userAgent := "this is a user agent"
	ip := "127.0.0.0"
	location := "canada"
	browser_name := "chrome"
	device_name := "desktop"
	osName := "windows"

	sessionInfo := jwt.SessionInfo{
		UserID:      s.userID,
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
	require.NoError(t, err)

	middleware := jwt.NewMiddleware(s.jwt)

	// Create validator
	validator := validation.New()

	// Create repository
	s.repo = accounts.NewRepository(queries, dbPool)

	// Create handler
	s.handler = accounts.NewHandler(validator, dbPool, s.repo, &logger)

	// Setup router
	s.router = router.NewRouter()
	s.router.Use(middleware.Verify)
}

func (s *HandlerTestSuite) SetupTest() {
	t := s.T()

	// Clear accounts table before each test
	_, err := s.dbPool.Exec(s.ctx, "TRUNCATE accounts CASCADE")
	require.NoError(t, err)

	// clear router
	s.router = router.NewRouter()
	middleware := jwt.NewMiddleware(s.jwt)
	s.router.Use(middleware.Verify)
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

func (s *HandlerTestSuite) makeAuthenticatedRequest(method, path string, body interface{}) (*httptest.ResponseRecorder, error) {
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
	req.Header.Set("Authorization", "Bearer "+s.authToken)

	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)
	return w, nil
}

// Test creating an account
func (s *HandlerTestSuite) TestCreateAccount() {
	t := s.T()

	// Register handler
	s.router.Post("/", s.handler.CreateAccount)

	// Create test request
	createReq := accounts.CreateAccountRequest{
		Name:     "Test Account",
		Type:     "cash",
		Balance:  1000.50,
		Currency: "USD",
		Color:    "red",
	}

	// Send request
	rr, err := s.makeAuthenticatedRequest("POST", "/", createReq)
	require.NoError(t, err)

	// Check response
	assert.Equal(t, http.StatusOK, rr.Code)

	var response repository.Account
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	require.NoError(t, err)

	// Verify account fields
	assert.Equal(t, "Test Account", response.Name)
	assert.Equal(t, repository.ACCOUNTTYPE("cash"), response.Type)
	assert.Equal(t, types.Numeric(1000.50), response.Balance)
	assert.Equal(t, "USD", response.Currency)
	assert.Equal(t, repository.COLORENUM("red"), response.Color)
	assert.Equal(t, s.userID, *response.CreatedBy)
}

// Test getting all accounts
func (s *HandlerTestSuite) TestGetAccounts() {
	t := s.T()

	// Register handler
	s.router.Get("/", s.handler.GetAccounts)

	// Create test accounts in database
	for i := 1; i <= 3; i++ {
		balance := types.Numeric(float64(i) * 100)
		_, err := s.repo.CreateAccount(s.ctx, repository.CreateAccountParams{
			Name:      fmt.Sprintf("Account %d", i),
			Type:      "cash",
			Balance:   balance,
			Currency:  "EUR",
			Color:     "red",
			CreatedBy: &s.userID,
		})
		require.NoError(t, err)
	}

	// Send request
	rr, err := s.makeAuthenticatedRequest("GET", "/", nil)
	require.NoError(t, err)

	// Check response
	assert.Equal(t, http.StatusOK, rr.Code)

	var accounts []repository.Account
	err = json.Unmarshal(rr.Body.Bytes(), &accounts)
	require.NoError(t, err)

	// Verify accounts
	assert.Len(t, accounts, 3)
	assert.Equal(t, "Account 1", accounts[0].Name)
	assert.Equal(t, repository.ACCOUNTTYPE("cash"), accounts[0].Type)
	assert.Equal(t, types.Numeric(100), accounts[0].Balance)
	assert.Equal(t, "Account 2", accounts[1].Name)
	assert.Equal(t, types.Numeric(200), accounts[1].Balance)
	assert.Equal(t, "Account 3", accounts[2].Name)
	assert.Equal(t, types.Numeric(300), accounts[2].Balance)
}

// Test getting a single account
func (s *HandlerTestSuite) TestGetAccount() {
	t := s.T()

	// Register handler
	s.router.Get("/{id}", s.handler.GetAccount)

	// Create test account
	balance := types.Numeric(500.75)
	account, err := s.repo.CreateAccount(s.ctx, repository.CreateAccountParams{
		Name:      "Test Get Account",
		Type:      "momo",
		Balance:   balance,
		Currency:  "JPY",
		Color:     "red",
		CreatedBy: &s.userID,
	})
	require.NoError(t, err)

	fmt.Println("/" + account.ID.String())

	// Send request
	rr, err := s.makeAuthenticatedRequest("GET", "/"+account.ID.String(), nil)
	require.NoError(t, err)

	// Check response
	assert.Equal(t, http.StatusOK, rr.Code)

	var response repository.Account
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	require.NoError(t, err)

	// Verify account
	assert.Equal(t, account.ID, response.ID)
	assert.Equal(t, "Test Get Account", response.Name)
	assert.Equal(t, repository.ACCOUNTTYPE("momo"), response.Type)
	assert.Equal(t, types.Numeric(500.75), response.Balance)
	assert.Equal(t, "JPY", response.Currency)
	assert.Equal(t, repository.COLORENUM("red"), response.Color)
}

// Test getting a non-existent account
func (s *HandlerTestSuite) TestGetAccountNotFound() {
	t := s.T()

	// Register handler
	s.router.Get("/{id}", s.handler.GetAccount)

	// Send request with random UUID
	nonExistentID := uuid.New()
	rr, err := s.makeAuthenticatedRequest("GET", "/"+nonExistentID.String(), nil)
	require.NoError(t, err)

	// Check response
	assert.Equal(t, http.StatusNotFound, rr.Code)
}

// Test updating an account
func (s *HandlerTestSuite) TestUpdateAccount() {
	t := s.T()

	// Register handler
	s.router.Put("/{id}", s.handler.UpdateAccount)

	// Create test account
	balance := types.Numeric(800.25)
	account, err := s.repo.CreateAccount(s.ctx, repository.CreateAccountParams{
		Name:      "Original Account",
		Type:      "momo",
		Balance:   balance,
		Currency:  "USD",
		Color:     "red",
		CreatedBy: &s.userID,
	})
	require.NoError(t, err)

	// Create update request
	updateReq := accounts.CreateAccountRequest{
		Name:     "Updated Account",
		Type:     "cash",
		Balance:  1200.50,
		Currency: "EUR",
		Color:    "red",
	}

	// Send request
	rr, err := s.makeAuthenticatedRequest("PUT", "/"+account.ID.String(), updateReq)
	require.NoError(t, err)

	// Check response
	assert.Equal(t, http.StatusOK, rr.Code)

	var response repository.Account
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	require.NoError(t, err)

	// Verify account
	assert.Equal(t, account.ID, response.ID)
	assert.Equal(t, "Updated Account", response.Name)
	assert.Equal(t, repository.ACCOUNTTYPE("cash"), response.Type)
	assert.Equal(t, types.Numeric(1200.50), response.Balance)
	assert.Equal(t, "EUR", response.Currency)
	assert.Equal(t, repository.COLORENUM("red"), response.Color)
}

// Test deleting an account
func (s *HandlerTestSuite) TestDeleteAccount() {
	t := s.T()

	// Register handler
	s.router.Delete("/{id}", s.handler.DeleteAccount)

	// Create test account
	balance := types.Numeric(300.00)
	account, err := s.repo.CreateAccount(s.ctx, repository.CreateAccountParams{
		Name:      "Account To Delete",
		Type:      "cash",
		Balance:   balance,
		Currency:  "USD",
		Color:     "red",
		CreatedBy: &s.userID,
	})
	require.NoError(t, err)

	// Send delete request
	rr, err := s.makeAuthenticatedRequest("DELETE", "/"+account.ID.String(), nil)
	require.NoError(t, err)

	// Check response
	assert.Equal(t, http.StatusOK, rr.Code)

	// // Verify account is deleted
	_, err = s.repo.GetAccountByID(s.ctx, account.ID)
	assert.Equal(t, pgx.ErrNoRows, err)
}

// Test invalid input for CreateAccount
func (s *HandlerTestSuite) TestCreateAccountInvalidInput() {
	t := s.T()

	// Register handler
	s.router.Post("/", s.handler.CreateAccount)

	// Test cases for invalid inputs
	testCases := []struct {
		name     string
		request  accounts.CreateAccountRequest
		expected int
	}{
		{
			name: "Empty Name",
			request: accounts.CreateAccountRequest{
				Name:     "",
				Type:     "cash",
				Balance:  100.0,
				Currency: "USD",
				Color:    "red",
			},
			expected: http.StatusInternalServerError, // Validation error
		},
		{
			name: "Invalid Account Type",
			request: accounts.CreateAccountRequest{
				Name:     "Test Account",
				Type:     "invalid-type",
				Balance:  100.0,
				Currency: "USD",
				Color:    "red",
			},
			expected: http.StatusBadRequest,
		},
		{
			name: "Invalid Color Format",
			request: accounts.CreateAccountRequest{
				Name:     "Test Account",
				Type:     "cash",
				Balance:  100.0,
				Currency: "USD",
				Color:    "invalid-color",
			},
			expected: http.StatusBadRequest,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Send request
			rr, err := s.makeAuthenticatedRequest("POST", "/", tc.request)
			require.NoError(t, err)

			// Check response
			assert.Equal(t, tc.expected, rr.Code)
		})
	}
}

// Test account trends
// func (s *HandlerTestSuite) TestGetAccountsTrends() {
// 	t := s.T()
//
// 	// Register handler
// 	s.router.Get("/trends", s.handler.GetAccountsTrends)
//
// 	// Create test accounts and transactions
// 	account1, err := s.repo.CreateAccount(s.ctx, repository.CreateAccountParams{
// 		Name:      "Trend Account 1",
// 		Type:      "savings",
// 		Balance:   types.Numeric(1000.0),
// 		Currency:  "USD",
// 		Color:     "red",
// 		CreatedBy: &s.userID,
// 	})
// 	require.NoError(t, err)
//
// 	account2, err := s.repo.CreateAccount(s.ctx, repository.CreateAccountParams{
// 		Name:      "Trend Account 2",
// 		Type:      "checking",
// 		Balance:   types.Numeric(2000.0),
// 		Currency:  "EUR",
// 		Color:     "red",
// 		CreatedBy: &s.userID,
// 	})
// 	require.NoError(t, err)
//
// 	// Add some transactions
// 	description := "Test transaction"
// 	now := time.Now().UTC()
// 	oneMonthAgo := now.AddDate(0, -1, 0)
// 	twoMonthsAgo := now.AddDate(0, -2, 0)
//
// 	// Insert transactions directly into database
// 	_, err = s.dbPool.Exec(s.ctx, `
// 		INSERT INTO transactions (
// 			id, amount, transaction_type, account_id, category_id,
// 			description, transaction_datetime, created_by
// 		) VALUES
// 		($1, 100.0, 'income', $2, $3, $4, $5, $6),
// 		($7, -50.0, 'expense', $2, $3, $4, $8, $6),
// 		($9, 200.0, 'income', $10, $3, $4, $11, $6)
// 	`,
// 		uuid.New(), account1.ID, uuid.New(), &description, now, s.userID,
// 		uuid.New(), account1.ID, &description, oneMonthAgo, s.userID,
// 		uuid.New(), account2.ID, &description, twoMonthsAgo, s.userID,
// 	)
// 	require.NoError(t, err)
//
// 	// Send request for trends
// 	startDate := twoMonthsAgo.Format("2006-01-02")
// 	endDate := now.Format("2006-01-02")
// 	rr, err := s.makeAuthenticatedRequest("GET", fmt.Sprintf("/trends?start=%s&end=%s", startDate, endDate), nil)
// 	require.NoError(t, err)
//
// 	// Check response
// 	assert.Equal(t, http.StatusOK, rr.Code)
//
// 	// We're just checking that the response is successful
// 	// The actual trends calculation would be better tested at the repository level
// 	var response interface{}
// 	err = json.Unmarshal(rr.Body.Bytes(), &response)
// 	require.NoError(t, err)
// }

// Test account balance timeline
// func (s *HandlerTestSuite) TestGetAccountBTimeline() {
// 	t := s.T()
//
// 	// Register handler
// 	s.router.Get("/{id}/timeline", s.handler.GetAccountBTimeline)
//
// 	// Create test account
// 	account, err := s.repo.CreateAccount(s.ctx, repository.CreateAccountParams{
// 		Name:      "Timeline Account",
// 		Type:      "savings",
// 		Balance:   types.Numeric(1000.0),
// 		Currency:  "USD",
// 		Color:     "red",
// 		CreatedBy: &s.userID,
// 	})
// 	require.NoError(t, err)
//
// 	// Add some transactions
// 	description := "Test transaction"
// 	now := time.Now().UTC()
// 	oneWeekAgo := now.AddDate(0, 0, -7)
// 	twoWeeksAgo := now.AddDate(0, 0, -14)
//
// 	// Insert transactions directly into database
// 	_, err = s.dbPool.Exec(s.ctx, `
// 		INSERT INTO transactions (
// 			id, amount, transaction_type, account_id, category_id,
// 			description, transaction_datetime, created_by
// 		) VALUES
// 		($1, 100.0, 'income', $2, $3, $4, $5, $6),
// 		($7, -50.0, 'expense', $2, $3, $4, $8, $6),
// 		($9, 200.0, 'income', $2, $3, $4, $10, $6)
// 	`,
// 		uuid.New(), account.ID, uuid.New(), &description, now, s.userID,
// 		uuid.New(), account.ID, &description, oneWeekAgo, s.userID,
// 		uuid.New(), account.ID, &description, twoWeeksAgo, s.userID,
// 	)
// 	require.NoError(t, err)
//
// 	// Send request
// 	rr, err := s.makeAuthenticatedRequest("GET", "/"+account.ID.String()+"/timeline", nil)
// 	require.NoError(t, err)
//
// 	// Check response
// 	assert.Equal(t, http.StatusOK, rr.Code)
//
// 	// The response is expected to be a timeline object
// 	var response interface{}
// 	err = json.Unmarshal(rr.Body.Bytes(), &response)
// 	require.NoError(t, err)
// }

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
			// wait.ForHTTP("/").WithPort("5432"),
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

	CREATE TABLE IF NOT EXISTS accounts (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		name VARCHAR(255) NOT NULL,
		type VARCHAR(50) NOT NULL,
		balance DECIMAL NOT NULL DEFAULT 0,
		currency VARCHAR(3) NOT NULL,
		color VARCHAR(20),
		meta JSONB DEFAULT '{}',
		created_by UUID REFERENCES users(id),
		updated_by UUID REFERENCES users(id),
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
	);
	
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

	CREATE TABLE IF NOT EXISTS transactions (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		amount DECIMAL NOT NULL,
		type VARCHAR(50) NOT NULL,
		account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
		destination_account_id UUID REFERENCES accounts(id),
		category_id UUID REFERENCES categories(id),
		description TEXT,
		transaction_datetime TIMESTAMP NOT NULL,
		details JSONB DEFAULT '{}',
		created_by UUID REFERENCES users(id),
		updated_by UUID REFERENCES users(id),
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
	);`

	_, err := db.Exec(ctx, schema)
	if err != nil {
		return fmt.Errorf("failed to initialize schema: %w", err)
	}

	return nil
}

// TestMain to run the test suite
func TestAccountHandlers(t *testing.T) {
	suite.Run(t, new(HandlerTestSuite))
}
