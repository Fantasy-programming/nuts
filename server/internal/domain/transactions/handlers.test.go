package transactions

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/repository/dto"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
)

// MockLogger is a simple mock for the logger
type MockLogger struct {
	mock.Mock
}

func (m *MockLogger) Error(msg string, err error) {
	m.Called(msg, err)
}

func (m *MockLogger) Info(msg string, args ...interface{}) {
	params := []interface{}{msg}
	params = append(params, args...)
	m.Called(params...)
}

// MockRepository is a mock implementation of the transactions.Repository interface
type MockRepository struct {
	mock.Mock
}

func (m *MockRepository) GetTransactions(ctx context.Context, params repository.ListTransactionsParams) ([]transactions.Group, error) {
	args := m.Called(ctx, params)
	return args.Get(0).([]transactions.Group), args.Error(1)
}

func (m *MockRepository) GetTransaction(ctx context.Context, id uuid.UUID) (repository.Transaction, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.Transaction), args.Error(1)
}

func (m *MockRepository) CreateTransaction(ctx context.Context, params repository.CreateTransactionParams) (repository.Transaction, error) {
	args := m.Called(ctx, params)
	return args.Get(0).(repository.Transaction), args.Error(1)
}

func (m *MockRepository) CreateTransfertTransaction(ctx context.Context, params transactions.TransfertParams) (repository.Transaction, error) {
	args := m.Called(ctx, params)
	return args.Get(0).(repository.Transaction), args.Error(1)
}

func (m *MockRepository) UpdateTransaction(ctx context.Context, params repository.UpdateTransactionParams) (repository.Transaction, error) {
	args := m.Called(ctx, params)
	return args.Get(0).(repository.Transaction), args.Error(1)
}

func (m *MockRepository) DeleteTransaction(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// HandlerTestSuite is a suite for testing transaction handlers
type HandlerTestSuite struct {
	suite.Suite
	mockRepo   *MockRepository
	mockLogger *MockLogger
	handler    *transactions.Handler
	container  *TestPostgresContainer
	validator  *validation.Validator
	router     *router.Router
	jwtService *jwt.Service
	userId     uuid.UUID
	token      string
}

func (s *HandlerTestSuite) SetupSuite() {
	t := s.T()
	ctx := context.Background()

	// Start Postgres container
	container, err := setupPostgres(ctx)
	require.NoError(t, err, "Failed to start postgres container")
	s.container = container

	// Setup database connection
	db, err := pgxpool.New(ctx, container.URI)
	require.NoError(t, err, "Failed to connect to postgres")

	// Initialize schema
	err = initializeSchema(ctx, db)
	require.NoError(t, err, "Failed to initialize database schema")

	// Create test user and generate JWT
	queries := repository.New(db)
	user, err := queries.CreateUser(ctx, repository.CreateUserParams{
		Email:     "test@example.com",
		Password:  "password",
		FirstName: "Test",
		LastName:  "User",
	})
	require.NoError(t, err, "Failed to create test user")
	s.userId = user.ID

	// Setup JWT
	tokenRepo := jwt.NewPgRepository(db)
	tokenLogger := jwt.NewLoggerAdapter(nil) // Pass nil for simplicity
	jwtConfig := jwt.Config{
		AccessTokenDuration:  15 * time.Minute,
		RefreshTokenDuration: 24 * time.Hour,
		SigningKey:           "test-signing-key",
	}
	s.jwtService = jwt.NewService(tokenRepo, jwtConfig, tokenLogger)

	// Generate token for test user
	tokenPair, err := s.jwtService.GenerateTokenPair(ctx, user.ID, []string{"user"})
	require.NoError(t, err, "Failed to generate JWT token")
	s.token = tokenPair.AccessToken
}

func (s *HandlerTestSuite) SetupTest() {
	s.mockRepo = new(MockRepository)
	s.mockLogger = new(MockLogger)
	s.validator = validation.New()

	// Initialize handler with mock repository
	s.handler = transactions.NewHandler(s.validator, s.mockRepo, s.mockLogger)

	// Create test router with JWT middleware
	middleware := jwt.NewMiddleware(s.jwtService)
	s.router = router.NewRouter()
	s.router.Use(middleware.Verify)
}

func (s *HandlerTestSuite) TearDownSuite() {
	if s.container != nil {
		ctx := context.Background()
		s.container.Terminate(ctx)
	}
}

func (s *HandlerTestSuite) makeAuthenticatedRequest(method, url string, body interface{}) (*httptest.ResponseRecorder, error) {
	var reqBody []byte
	var err error

	if body != nil {
		reqBody, err = json.Marshal(body)
		if err != nil {
			return nil, err
		}
	}

	req := httptest.NewRequest(method, url, bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.token)

	rr := httptest.NewRecorder()
	s.router.ServeHTTP(rr, req)

	return rr, nil
}

func (s *HandlerTestSuite) TestCreateTransaction() {
	t := s.T()

	// Setup expected transaction
	now := time.Now().UTC()
	expectedTxID := uuid.New()
	description := "Test transaction"
	amount := -50.0

	expectedTx := repository.Transaction{
		ID:                  expectedTxID,
		Amount:              "-50",
		Type:                "expense",
		AccountID:           uuid.New(),
		CategoryID:          uuid.New(),
		Description:         &description,
		TransactionDatetime: now,
		CreatedBy:           &s.userId,
	}

	// Configure mock
	s.mockLogger.On("Info", mock.Anything, mock.Anything).Return()
	s.mockRepo.On("CreateTransaction", mock.Anything, mock.Anything).Return(expectedTx, nil)

	// Register handler
	s.router.Post("/", s.handler.CreateTransaction)

	// Create request body
	reqBody := transactions.CreateTransactionRequest{
		TransactionDatetime: now,
		Description:         &description,
		Type:                "expense",
		AccountID:           expectedTx.AccountID.String(),
		CategoryID:          expectedTx.CategoryID.String(),
		Amount:              amount,
		Details:             dto.Details{},
	}

	// Send request
	rr, err := s.makeAuthenticatedRequest("POST", "/", reqBody)
	require.NoError(t, err)

	// Verify response
	assert.Equal(t, http.StatusOK, rr.Code)

	var responseTx repository.Transaction
	err = json.Unmarshal(rr.Body.Bytes(), &responseTx)
	require.NoError(t, err)

	assert.Equal(t, expectedTxID, responseTx.ID)
	assert.Equal(t, "-50", responseTx.Amount)
	assert.Equal(t, "expense", responseTx.Type)
	assert.Equal(t, description, *responseTx.Description)

	// Verify mock calls
	s.mockRepo.AssertExpectations(t)
}

func (s *HandlerTestSuite) TestCreateTransfert() {
	t := s.T()

	// Setup expected transaction
	now := time.Now().UTC()
	expectedTxID := uuid.New()
	description := "Test transfer"
	sourceAccount := uuid.New()
	destAccount := uuid.New()
	amount := 100.0

	expectedTx := repository.Transaction{
		ID:                   expectedTxID,
		Amount:               "-100",
		Type:                 "transfer",
		AccountID:            sourceAccount,
		DestinationAccountID: &destAccount,
		CategoryID:           uuid.New(),
		Description:          &description,
		TransactionDatetime:  now,
		CreatedBy:            &s.userId,
	}

	// Configure mock
	s.mockLogger.On("Info", mock.Anything, mock.Anything).Return()
	s.mockRepo.On("CreateTransfertTransaction", mock.Anything, mock.Anything).Return(expectedTx, nil)

	// Register handler
	s.router.Post("/transfer", s.handler.CreateTransfert)

	// Create request body
	reqBody := transactions.CreateTransfertRequest{
		TransactionDatetime:  now,
		Description:          &description,
		Type:                 "transfer",
		AccountID:            sourceAccount.String(),
		DestinationAccountID: destAccount.String(),
		CategoryID:           expectedTx.CategoryID.String(),
		Amount:               amount,
		Details:              dto.Details{},
	}

	// Send request
	rr, err := s.makeAuthenticatedRequest("POST", "/transfer", reqBody)
	require.NoError(t, err)

	// Verify response
	assert.Equal(t, http.StatusOK, rr.Code)

	var responseTx repository.Transaction
	err = json.Unmarshal(rr.Body.Bytes(), &responseTx)
	require.NoError(t, err)

	assert.Equal(t, expectedTxID, responseTx.ID)
	assert.Equal(t, "-100", responseTx.Amount)
	assert.Equal(t, "transfer", responseTx.Type)
	assert.Equal(t, sourceAccount, responseTx.AccountID)
	assert.Equal(t, destAccount, *responseTx.DestinationAccountID)

	// Verify mock calls
	s.mockRepo.AssertExpectations(t)
}

func (s *HandlerTestSuite) TestTransferErrors() {
	t := s.T()

	testCases := []struct {
		name          string
		error         error
		expectedCode  int
		modifyRequest func(*transactions.CreateTransfertRequest)
	}{
		{
			name:          "Insufficient Balance",
			error:         transactions.ErrLowBalance,
			expectedCode:  http.StatusBadRequest,
			modifyRequest: func(req *transactions.CreateTransfertRequest) {},
		},
		{
			name:          "Source Account Not Found",
			error:         transactions.ErrSrcAccNotFound,
			expectedCode:  http.StatusNotFound,
			modifyRequest: func(req *transactions.CreateTransfertRequest) {},
		},
		{
			name:          "Destination Account Not Found",
			error:         transactions.ErrDestAccNotFound,
			expectedCode:  http.StatusNotFound,
			modifyRequest: func(req *transactions.CreateTransfertRequest) {},
		},
		{
			name:         "Same Account",
			error:        nil, // Will be caught by validation
			expectedCode: http.StatusBadRequest,
			modifyRequest: func(req CreateTransfertRequest) {
				sameID := uuid.New().String()
				req.AccountID = sameID
				req.DestinationAccountID = sameID
			},
		},
		{
			name:         "Invalid Account ID",
			error:        nil, // Will be caught by validation
			expectedCode: http.StatusBadRequest,
			modifyRequest: func(req CreateTransfertRequest) {
				req.AccountID = "invalid-uuid"
			},
		},
		{
			name:         "Negative Amount",
			error:        nil, // Will be caught by validation
			expectedCode: http.StatusBadRequest,
			modifyRequest: func(req CreateTransfertRequest) {
				req.Amount = -50.0
			},
		},
		{
			name:         "Zero Amount",
			error:        nil, // Will be caught by validation
			expectedCode: http.StatusBadRequest,
			modifyRequest: func(req CreateTransfertRequest) {
				req.Amount = 0.0
			},
		},
	}

	// Register handler
	s.router.Post("/transfer", s.handler.CreateTransfert)

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Reset mocks
			s.SetupTest()

			// Base request
			now := time.Now().UTC()
			description := "Test transfer"
			srcAccount := uuid.New()
			destAccount := uuid.New()
			reqBody := CreateTransfertRequest{
				TransactionDatetime:  now,
				Description:          &description,
				Type:                 "transfer",
				AccountID:            srcAccount.String(),
				DestinationAccountID: destAccount.String(),
				CategoryID:           uuid.New().String(),
				Amount:               100.0,
				Details:              dto.Details{},
			}

			// Apply test case modifications
			tc.modifyRequest(&reqBody)

			// Configure mock if needed
			if tc.error != nil {
				s.mockLogger.On("Info", mock.Anything, mock.Anything).Return()
				s.mockRepo.On("CreateTransfertTransaction", mock.Anything, mock.Anything).Return(repository.Transaction{}, tc.error)
			}

			// Send request
			rr, err := s.makeAuthenticatedRequest("POST", "/transfer", reqBody)
			require.NoError(t, err)

			// Verify response
			assert.Equal(t, tc.expectedCode, rr.Code)

			// Verify mock calls if applicable
			if tc.error != nil {
				s.mockRepo.AssertExpectations(t)
			}
		})
	}
}

func (s *HandlerTestSuite) TestGetTransactions() {
	t := s.T()

	// Setup mock data
	txID1 := uuid.New()
	txID2 := uuid.New()
	accID := uuid.New()
	catID := uuid.New()
	description := "Test transaction"
	now := time.Now().UTC()

	mockGroups := []Group{
		{
			Date: now,
			Transactions: []repository.Transaction{
				{
					ID:                  txID1,
					Amount:              "100.50",
					Type:                "income",
					AccountID:           accID,
					CategoryID:          catID,
					Description:         &description,
					TransactionDatetime: now,
					CreatedBy:           &s.userId,
				},
				{
					ID:                  txID2,
					Amount:              "-50.25",
					Type:                "expense",
					AccountID:           accID,
					CategoryID:          catID,
					Description:         &description,
					TransactionDatetime: now,
					CreatedBy:           &s.userId,
				},
			},
		},
	}

	// Configure mock
	s.mockLogger.On("Info", mock.Anything, mock.Anything).Return()
	s.mockRepo.On("GetTransactions", mock.Anything, mock.Anything).Return(mockGroups, nil)

	// Register handler
	s.router.Get("/", s.handler.GetTransactions)

	// Send request
	rr, err := s.makeAuthenticatedRequest("GET", "/?limit=10&offset=0", nil)
	require.NoError(t, err)

	// Verify response
	assert.Equal(t, http.StatusOK, rr.Code)

	var response []Group
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, 1, len(response))
	assert.Equal(t, 2, len(response[0].Transactions))
	assert.Equal(t, txID1, response[0].Transactions[0].ID)
	assert.Equal(t, txID2, response[0].Transactions[1].ID)

	// Verify mock calls
	s.mockRepo.AssertExpectations(t)
}

func (s *HandlerTestSuite) TestGetTransaction() {
	t := s.T()

	// Setup expected transaction
	txID := uuid.New()
	accID := uuid.New()
	catID := uuid.New()
	description := "Test transaction"
	now := time.Now().UTC()

	expectedTx := repository.Transaction{
		ID:                  txID,
		Amount:              "100.50",
		Type:                "income",
		AccountID:           accID,
		CategoryID:          catID,
		Description:         &description,
		TransactionDatetime: now,
		CreatedBy:           &s.userId,
	}

	// Configure mock
	s.mockLogger.On("Info", mock.Anything, mock.Anything).Return()
	s.mockRepo.On("GetTransaction", mock.Anything, txID).Return(expectedTx, nil)

	// Register handler
	s.router.Get("/:id", s.handler.GetTransaction)

	// Send request
	rr, err := s.makeAuthenticatedRequest("GET", "/"+txID.String(), nil)
	require.NoError(t, err)

	// Verify response
	assert.Equal(t, http.StatusOK, rr.Code)

	var responseTx repository.Transaction
	err = json.Unmarshal(rr.Body.Bytes(), &responseTx)
	require.NoError(t, err)

	assert.Equal(t, txID, responseTx.ID)
	assert.Equal(t, "100.50", responseTx.Amount)
	assert.Equal(t, "income", responseTx.Type)
	assert.Equal(t, accID, responseTx.AccountID)
	assert.Equal(t, catID, responseTx.CategoryID)
	assert.Equal(t, description, *responseTx.Description)

	// Verify mock calls
	s.mockRepo.AssertExpectations(t)
}

func (s *HandlerTestSuite) TestGetTransactionNotFound() {
	t := s.T()

	// Invalid ID
	txID := uuid.New()

	// Configure mock
	s.mockLogger.On("Info", mock.Anything, mock.Anything).Return()
	s.mockRepo.On("GetTransaction", mock.Anything, txID).Return(repository.Transaction{}, fmt.Errorf("transaction not found"))

	// Register handler
	s.router.Get("/:id", s.handler.GetTransaction)

	// Send request
	rr, err := s.makeAuthenticatedRequest("GET", "/"+txID.String(), nil)
	require.NoError(t, err)

	// Verify response
	assert.Equal(t, http.StatusNotFound, rr.Code)

	// Verify mock calls
	s.mockRepo.AssertExpectations(t)
}

func (s *HandlerTestSuite) TestUpdateTransaction() {
	t := s.T()

	// Setup test data
	txID := uuid.New()
	accID := uuid.New()
	catID := uuid.New()
	description := "Updated transaction"
	now := time.Now().UTC()

	updatedTx := repository.Transaction{
		ID:                  txID,
		Amount:              "75.25",
		Type:                "income",
		AccountID:           accID,
		CategoryID:          catID,
		Description:         &description,
		TransactionDatetime: now,
		CreatedBy:           &s.userId,
	}

	// Configure mock
	s.mockLogger.On("Info", mock.Anything, mock.Anything).Return()
	s.mockRepo.On("UpdateTransaction", mock.Anything, mock.Anything).Return(updatedTx, nil)

	// Register handler
	s.router.Put("/:id", s.handler.UpdateTransaction)

	// Create request body
	reqBody := UpdateTransactionRequest{
		TransactionDatetime: now,
		Description:         &description,
		Type:                "income",
		AccountID:           accID.String(),
		CategoryID:          catID.String(),
		Amount:              75.25,
		Details:             dto.Details{},
	}

	// Send request
	rr, err := s.makeAuthenticatedRequest("PUT", "/"+txID.String(), reqBody)
	require.NoError(t, err)

	// Verify response
	assert.Equal(t, http.StatusOK, rr.Code)

	var responseTx repository.Transaction
	err = json.Unmarshal(rr.Body.Bytes(), &responseTx)
	require.NoError(t, err)

	assert.Equal(t, txID, responseTx.ID)
	assert.Equal(t, "75.25", responseTx.Amount)
	assert.Equal(t, description, *responseTx.Description)

	// Verify mock calls
	s.mockRepo.AssertExpectations(t)
}

func (s *HandlerTestSuite) TestDeleteTransaction() {
	t := s.T()

	// Setup test data
	txID := uuid.New()

	// Configure mock
	s.mockLogger.On("Info", mock.Anything, mock.Anything).Return()
	s.mockRepo.On("DeleteTransaction", mock.Anything, txID).Return(nil)

	// Register handler
	s.router.Delete("/:id", s.handler.DeleteTransaction)

	// Send request
	rr, err := s.makeAuthenticatedRequest("DELETE", "/"+txID.String(), nil)
	require.NoError(t, err)

	// Verify response
	assert.Equal(t, http.StatusNoContent, rr.Code)

	// Verify mock calls
	s.mockRepo.AssertExpectations(t)
}

func (s *HandlerTestSuite) TestDeleteTransactionNotFound() {
	t := s.T()

	// Setup test data
	txID := uuid.New()

	// Configure mock
	s.mockLogger.On("Info", mock.Anything, mock.Anything).Return()
	s.mockRepo.On("DeleteTransaction", mock.Anything, txID).Return(fmt.Errorf("transaction not found"))

	// Register handler
	s.router.Delete("/:id", s.handler.DeleteTransaction)

	// Send request
	rr, err := s.makeAuthenticatedRequest("DELETE", "/"+txID.String(), nil)
	require.NoError(t, err)

	// Verify response
	assert.Equal(t, http.StatusNotFound, rr.Code)

	// Verify mock calls
	s.mockRepo.AssertExpectations(t)
}

// Helper function to set up test postgres container
func setupPostgres(ctx context.Context) (*TestPostgresContainer, error) {
	// Define container request
	req := testcontainers.ContainerRequest{
		Image:        "postgres:15-alpine",
		ExposedPorts: []string{"5432/tcp"},
		Env: map[string]string{
			"POSTGRES_USER":     "postgres",
			"POSTGRES_PASSWORD": "postgres",
			"POSTGRES_DB":       "testdb",
		},
		WaitingFor: wait.ForLog("database system is ready to accept connections"),
	}

	// Start container
	container, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to start container: %w", err)
	}

	// Get mapped port
	mappedPort, err := container.MappedPort(ctx, "5432")
	if err != nil {
		return nil, fmt.Errorf("failed to get mapped port: %w", err)
	}

	// Get host
	host, err := container.Host(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get host: %w", err)
	}

	// Construct connection URI
	uri := fmt.Sprintf("postgres://postgres:postgres@%s:%s/testdb?sslmode=disable", host, mappedPort.Port())

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
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS tokens (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		token_type VARCHAR(20) NOT NULL,
		token_value VARCHAR(500) NOT NULL,
		expires_at TIMESTAMP NOT NULL,
		created_at TIMESTAMP DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS accounts (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		name VARCHAR(255) NOT NULL,
		description TEXT,
		initial_balance DECIMAL NOT NULL DEFAULT 0,
		current_balance DECIMAL NOT NULL DEFAULT 0,
		account_type VARCHAR(50) NOT NULL,
		created_by UUID REFERENCES users(id),
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS categories (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		name VARCHAR(255) NOT NULL,
		description TEXT,
		color VARCHAR(20),
		icon VARCHAR(50),
		created_by UUID REFERENCES users(id),
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS transactions (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		amount DECIMAL NOT NULL,
		transaction_type VARCHAR(50) NOT NULL,
		account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
		destination_account_id UUID REFERENCES accounts(id),
		category_id UUID REFERENCES categories(id),
		description TEXT,
		transaction_datetime TIMESTAMP NOT NULL,
		details JSONB DEFAULT '{}',
		created_by UUID REFERENCES users(id),
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW()
	);`

	_, err := db.Exec(ctx, schema)
	if err != nil {
		return fmt.Errorf("failed to initialize schema: %w", err)
	}

	return nil
}

// TestMain to run the test suite
func TestTransactionHandlers(t *testing.T) {
	suite.Run(t, new(HandlerTestSuite))
}
