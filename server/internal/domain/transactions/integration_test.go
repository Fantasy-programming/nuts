package transactions_test

// import (
// 	"context"
// 	"database/sql"
// 	"fmt"
// 	"os"
// 	"testing"
// 	"time"
//
// 	"github.com/Fantasy-Programming/nuts/internal/domain/transactions"
// 	"github.com/Fantasy-Programming/nuts/internal/repository"
// 	"github.com/google/uuid"
// 	"github.com/jackc/pgx/v5/pgxpool"
// 	"github.com/stretchr/testify/assert"
// 	"github.com/stretchr/testify/require"
// 	"github.com/stretchr/testify/suite"
// 	"github.com/testcontainers/testcontainers-go"
// 	"github.com/testcontainers/testcontainers-go/wait"
// )
//
// // TestRepositorySuite is a test suite for testing the transactions repository with a real database
// type TestRepositorySuite struct {
// 	suite.Suite
// 	container  *TestPostgresContainer
// 	db         *pgxpool.Pool
// 	repo       transactions.Repository
// 	queries    *repository.Queries
// 	users      map[string]uuid.UUID
// 	accounts   map[string]uuid.UUID
// 	categories map[string]uuid.UUID
// }
//
// // SetupSuite initializes the test container and database connection
// func (s *TestRepositorySuite) SetupSuite() {
// 	t := s.T()
// 	ctx := context.Background()
//
// 	// Start Postgres container
// 	container, err := setupPostgres(ctx)
// 	require.NoError(t, err, "Failed to start postgres container")
// 	s.container = container
//
// 	// Setup database connection
// 	db, err := pgxpool.New(ctx, container.URI)
// 	require.NoError(t, err, "Failed to connect to postgres")
// 	s.db = db
//
// 	// Initialize schema
// 	err = initializeSchema(ctx, db)
// 	require.NoError(t, err, "Failed to initialize database schema")
//
// 	// Create repository and queries
// 	s.queries = repository.New(db)
// 	s.repo = transactions.NewRepository(db, s.queries)
//
// 	// Setup test data
// 	s.users = make(map[string]uuid.UUID)
// 	s.accounts = make(map[string]uuid.UUID)
// 	s.categories = make(map[string]uuid.UUID)
// 	err = s.setupTestData(ctx)
// 	require.NoError(t, err, "Failed to setup test data")
// }
//
// // TearDownSuite cleans up resources after all tests have run
// func (s *TestRepositorySuite) TearDownSuite() {
// 	if s.db != nil {
// 		s.db.Close()
// 	}
// 	if s.container != nil {
// 		ctx := context.Background()
// 		s.container.Terminate(ctx)
// 	}
// }
//
// // setupTestData populates the database with test users, accounts, and categories
// func (s *TestRepositorySuite) setupTestData(ctx context.Context) error {
// 	// Create test users
//
// 	testPass := "password123"
// 	testFirstName := "Test"
// 	testLastName := "User1"
//
// 	user1, err := s.queries.CreateUser(ctx, repository.CreateUserParams{
// 		Email:     "test1@example.com",
// 		Password:  &testPass,
// 		FirstName: &testFirstName,
// 		LastName:  &testLastName,
// 	})
// 	if err != nil {
// 		return fmt.Errorf("failed to create test user1: %w", err)
// 	}
//
// 	s.users["user1"] = user1.ID
//
// 	testLastName = "User2"
//
// 	user2, err := s.queries.CreateUser(ctx, repository.CreateUserParams{
// 		Email:     "test2@example.com",
// 		Password:  &testPass,
// 		FirstName: &testFirstName,
// 		LastName:  &testLastName,
// 	})
// 	if err != nil {
// 		return fmt.Errorf("failed to create test user2: %w", err)
// 	}
// 	s.users["user2"] = user2.ID
//
// 	// Create accounts for user1
// 	checking, err := s.queries.CreateAccount(ctx, repository.CreateAccountParams{
// 		Name:        "Checking",
// 		Description: sql.NullString{String: "Primary checking account", Valid: true},
// 		Type:        "checking",
// 		Balance:     "1000",
// 		Currency:    "USD",
// 		CreatedBy:   &user1.ID,
// 	})
// 	if err != nil {
// 		return fmt.Errorf("failed to create checking account: %w", err)
// 	}
// 	s.accounts["checking"] = checking.ID
//
// 	savings, err := s.queries.CreateAccount(ctx, repository.CreateAccountParams{
// 		Name:        "Savings",
// 		Description: sql.NullString{String: "Savings account", Valid: true},
// 		Type:        "savings",
// 		Balance:     "5000",
// 		Currency:    "USD",
// 		CreatedBy:   &user1.ID,
// 	})
// 	if err != nil {
// 		return fmt.Errorf("failed to create savings account: %w", err)
// 	}
// 	s.accounts["savings"] = savings.ID
//
// 	// Create account for user2
// 	otherAccount, err := s.queries.CreateAccount(ctx, repository.CreateAccountParams{
// 		Name:      "Other User Account",
// 		Type:      "checking",
// 		Balance:   "2000",
// 		Currency:  "USD",
// 		CreatedBy: &user2.ID,
// 	})
// 	if err != nil {
// 		return fmt.Errorf("failed to create other user account: %w", err)
// 	}
// 	s.accounts["other"] = otherAccount.ID
//
// 	// Create categories
// 	food, err := s.queries.CreateCategory(ctx, repository.CreateCategoryParams{
// 		Name:        "Food",
// 		Description: sql.NullString{String: "Food expenses", Valid: true},
// 		Color:       "#FF5733",
// 		Icon:        "restaurant",
// 		CreatedBy:   &user1.ID,
// 	})
// 	if err != nil {
// 		return fmt.Errorf("failed to create food category: %w", err)
// 	}
// 	s.categories["food"] = food.ID
//
// 	transfer, err := s.queries.CreateCategory(ctx, repository.CreateCategoryParams{
// 		Name:        "Transfer",
// 		Description: sql.NullString{String: "Account transfers", Valid: true},
// 		Color:       "#33FF57",
// 		Icon:        "swap_horiz",
// 		CreatedBy:   &user1.ID,
// 	})
// 	if err != nil {
// 		return fmt.Errorf("failed to create transfer category: %w", err)
// 	}
// 	s.categories["transfer"] = transfer.ID
//
// 	return nil
// }
//
// func (s *TestRepositorySuite) TestCreateTransaction() {
// 	t := s.T()
// 	ctx := context.Background()
//
// 	// Create a description for the transaction
// 	description := "Grocery shopping"
//
// 	// Prepare transaction params
// 	params := repository.CreateTransactionParams{
// 		Amount:              "-50", // Expense of $50
// 		Type:                "expense",
// 		AccountID:           s.accounts["checking"],
// 		CategoryID:          s.categories["food"],
// 		Description:         &description,
// 		TransactionDatetime: time.Now().UTC(),
// 		Details: map[string]interface{}{
// 			"location": "Supermarket",
// 			"medium":   "card",
// 		},
// 		CreatedBy: &s.users["user1"],
// 	}
//
// 	// Create the transaction
// 	tx, err := s.repo.CreateTransaction(ctx, params)
// 	require.NoError(t, err)
// 	assert.Equal(t, params.Amount, tx.Amount)
// 	assert.Equal(t, params.Type, tx.Type)
// 	assert.Equal(t, params.AccountID, tx.AccountID)
//
// 	// Verify the account balance was updated
// 	account, err := s.queries.GetAccountById(ctx, s.accounts["checking"])
// 	require.NoError(t, err)
// 	// The original balance was 1000, we subtracted 50
// 	assert.Equal(t, "950", account.Balance.String())
// }
//
// func (s *TestRepositorySuite) TestCreateTransferTransaction() {
// 	t := s.T()
// 	ctx := context.Background()
//
// 	// Create a description for the transfer
// 	description := "Monthly savings transfer"
//
// 	// Prepare transfer params
// 	params := TransfertParams{
// 		Amount:               100, // Transfer $100
// 		Type:                 "transfer",
// 		AccountID:            s.accounts["checking"],
// 		DestinationAccountID: s.accounts["savings"],
// 		CategoryID:           s.categories["transfer"],
// 		Description:          &description,
// 		TransactionDatetime:  time.Now().UTC(),
// 		Details: map[string]interface{}{
// 			"note": "Monthly automatic transfer",
// 		},
// 		UserID: s.users["user1"],
// 	}
//
// 	// Create the transfer
// 	tx, err := s.repo.CreateTransfertTransaction(ctx, params)
// 	require.NoError(t, err)
// 	assert.Equal(t, "-100", tx.Amount)
// 	assert.Equal(t, params.Type, tx.Type)
// 	assert.Equal(t, params.AccountID, tx.AccountID)
// 	assert.NotNil(t, tx.DestinationAccountID)
// 	assert.Equal(t, params.DestinationAccountID, *tx.DestinationAccountID)
//
// 	// Verify source account balance was updated
// 	sourceAccount, err := s.queries.GetAccountById(ctx, s.accounts["checking"])
// 	require.NoError(t, err)
// 	// The balance was 950 after the previous test, now minus 100
// 	assert.Equal(t, "850", sourceAccount.Balance.String())
//
// 	// Verify destination account balance was updated
// 	destAccount, err := s.queries.GetAccountById(ctx, s.accounts["savings"])
// 	require.NoError(t, err)
// 	// The balance was 5000, now plus 100
// 	assert.Equal(t, "5100", destAccount.Balance.String())
// }
//
// func (s *TestRepositorySuite) TestGetTransaction() {
// 	t := s.T()
// 	ctx := context.Background()
//
// 	// First create a transaction to retrieve
// 	description := "Test transaction"
// 	params := repository.CreateTransactionParams{
// 		Amount:              "75.25",
// 		Type:                "income",
// 		AccountID:           s.accounts["checking"],
// 		CategoryID:          s.categories["food"],
// 		Description:         &description,
// 		TransactionDatetime: time.Now().UTC(),
// 		Details: map[string]interface{}{
// 			"source": "refund",
// 		},
// 		CreatedBy: &s.users["user1"],
// 	}
//
// 	tx, err := s.repo.CreateTransaction(ctx, params)
// 	require.NoError(t, err)
//
// 	// Now retrieve the transaction
// 	retrievedTx, err := s.repo.GetTransaction(ctx, tx.ID)
// 	require.NoError(t, err)
//
// 	// Verify the retrieved transaction matches what we created
// 	assert.Equal(t, tx.ID, retrievedTx.ID)
// 	assert.Equal(t, params.Amount, retrievedTx.Amount)
// 	assert.Equal(t, params.Type, retrievedTx.Type)
// 	assert.Equal(t, params.AccountID, retrievedTx.AccountID)
// 	assert.Equal(t, description, *retrievedTx.Description)
// }
//
// func (s *TestRepositorySuite) TestUpdateTransaction() {
// 	t := s.T()
// 	ctx := context.Background()
//
// 	// First create a transaction to update
// 	originalDescription := "Original description"
// 	params := repository.CreateTransactionParams{
// 		Amount:              "-30",
// 		Type:                "expense",
// 		AccountID:           s.accounts["checking"],
// 		CategoryID:          s.categories["food"],
// 		Description:         &originalDescription,
// 		TransactionDatetime: time.Now().UTC(),
// 		Details: map[string]interface{}{
// 			"location": "Restaurant",
// 		},
// 		CreatedBy: &s.users["user1"],
// 	}
//
// 	tx, err := s.repo.CreateTransaction(ctx, params)
// 	require.NoError(t, err)
//
// 	// Update the transaction
// 	newDescription := "Updated description"
// 	updateParams := repository.UpdateTransactionParams{
// 		ID:          tx.ID,
// 		Description: &newDescription,
// 		Details: map[string]interface{}{
// 			"location": "Different Restaurant",
// 			"note":     "Business lunch",
// 		},
// 	}
//
// 	updatedTx, err := s.repo.UpdateTransaction(ctx, updateParams)
// 	require.NoError(t, err)
//
// 	// Verify the transaction was updated
// 	assert.Equal(t, newDescription, *updatedTx.Description)
// 	assert.Equal(t, "Different Restaurant", updatedTx.Details["location"])
// 	assert.Equal(t, "Business lunch", updatedTx.Details["note"])
// }
//
// func (s *TestRepositorySuite) TestDeleteTransaction() {
// 	t := s.T()
// 	ctx := context.Background()
//
// 	// First create a transaction to delete
// 	description := "To be deleted"
// 	params := repository.CreateTransactionParams{
// 		Amount:              "-15",
// 		Type:                "expense",
// 		AccountID:           s.accounts["checking"],
// 		CategoryID:          s.categories["food"],
// 		Description:         &description,
// 		TransactionDatetime: time.Now().UTC(),
// 		CreatedBy:           &s.users["user1"],
// 	}
//
// 	tx, err := s.repo.CreateTransaction(ctx, params)
// 	require.NoError(t, err)
//
// 	// Delete the transaction
// 	err = s.repo.DeleteTransaction(ctx, tx.ID)
// 	require.NoError(t, err)
//
// 	// Verify the transaction was deleted
// 	_, err = s.repo.GetTransaction(ctx, tx.ID)
// 	assert.Error(t, err) // We expect an error as the transaction shouldn't exist
// }
//
// func (s *TestRepositorySuite) TestTransferErrorCases() {
// 	t := s.T()
// 	ctx := context.Background()
//
// 	description := "Test transfer"
//
// 	// Test case: insufficient balance
// 	params := transactions.TransfertParams{
// 		Amount:               10000, // More than available balance
// 		Type:                 "transfer",
// 		AccountID:            s.accounts["checking"],
// 		DestinationAccountID: s.accounts["savings"],
// 		CategoryID:           s.categories["transfer"],
// 		Description:          &description,
// 		TransactionDatetime:  time.Now().UTC(),
// 		UserID:               s.users["user1"],
// 	}
//
// 	_, err := s.repo.CreateTransfertTransaction(ctx, params)
// 	assert.ErrorIs(t, err, transactions.ErrLowBalance)
//
// 	// Test case: source account not found or doesn't belong to user
// 	params = transactions.TransfertParams{
// 		Amount:               100,
// 		Type:                 "transfer",
// 		AccountID:            s.accounts["other"], // Account belongs to user2
// 		DestinationAccountID: s.accounts["savings"],
// 		CategoryID:           s.categories["transfer"],
// 		Description:          &description,
// 		TransactionDatetime:  time.Now().UTC(),
// 		UserID:               s.users["user1"], // User1 is trying to use it
// 	}
//
// 	_, err = s.repo.CreateTransfertTransaction(ctx, params)
// 	assert.ErrorIs(t, err, transactions.ErrSrcAccNotFound)
//
// 	// Test case: destination account not found or doesn't belong to user
// 	params = transactions.TransfertParams{
// 		Amount:               100,
// 		Type:                 "transfer",
// 		AccountID:            s.accounts["checking"],
// 		DestinationAccountID: s.accounts["other"], // Account belongs to user2
// 		CategoryID:           s.categories["transfer"],
// 		Description:          &description,
// 		TransactionDatetime:  time.Now().UTC(),
// 		UserID:               s.users["user1"], // User1 is trying to use it
// 	}
//
// 	_, err = s.repo.CreateTransfertTransaction(ctx, params)
// 	assert.ErrorIs(t, err, transactions.ErrDestAccNotFound)
// }
//
// // Helper functions for container setup
//
// // setupPostgres starts a PostgreSQL container and returns its connection details
// func setupPostgres(ctx context.Context) (*TestPostgresContainer, error) {
// 	dbName := "test_nuts_db"
// 	dbUser := "testuser"
// 	dbPassword := "testpassword"
//
// 	req := testcontainers.ContainerRequest{
// 		Image:        "postgres:15",
// 		ExposedPorts: []string{"5432/tcp"},
// 		WaitingFor:   wait.ForListeningPort("5432/tcp"),
// 		Env: map[string]string{
// 			"POSTGRES_USER":     dbUser,
// 			"POSTGRES_PASSWORD": dbPassword,
// 			"POSTGRES_DB":       dbName,
// 		},
// 	}
//
// 	container, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
// 		ContainerRequest: req,
// 		Started:          true,
// 	})
// 	if err != nil {
// 		return nil, err
// 	}
//
// 	host, err := container.Host(ctx)
// 	if err != nil {
// 		return nil, err
// 	}
//
// 	port, err := container.MappedPort(ctx, "5432")
// 	if err != nil {
// 		return nil, err
// 	}
//
// 	uri := fmt.Sprintf("postgres://%s:%s@%s:%s/%s",
// 		dbUser, dbPassword, host, port.Port(), dbName)
//
// 	return &TestPostgresContainer{
// 		Container: container,
// 		URI:       uri,
// 		Host:      host,
// 		Port:      port.Port(),
// 		Username:  dbUser,
// 		Password:  dbPassword,
// 		Database:  dbName,
// 	}, nil
// }
//
// // initializeSchema sets up the database schema using migration files
// func initializeSchema(ctx context.Context, db *pgxpool.Pool) error {
// 	// Read schema file
// 	schema, err := os.ReadFile("../../repository/migrations/000001_init_schema.up.sql")
// 	if err != nil {
// 		// Try alternative path if first one fails
// 		schema, err = os.ReadFile("../repository/migrations/000001_init_schema.up.sql")
// 		if err != nil {
// 			return fmt.Errorf("failed to read schema file: %w", err)
// 		}
// 	}
//
// 	// Execute schema creation
// 	_, err = db.Exec(ctx, string(schema))
// 	if err != nil {
// 		return fmt.Errorf("failed to execute schema creation: %w", err)
// 	}
//
// 	return nil
// }
//
// // TestTransactionsRepository runs the repository test suite
// func TestTransactionsRepository(t *testing.T) {
// 	// Skip tests if CI/short mode is enabled
// 	if testing.Short() {
// 		t.Skip("Skipping integration tests in short mode")
// 	}
//
// 	suite.Run(t, new(TestRepositorySuite))
// }
