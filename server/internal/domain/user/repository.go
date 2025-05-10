package user

import (
	"context"
	"errors"
	"fmt"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/pkg/storage"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/markbates/goth"
)

// Repository defines the interface for user data operations
type Repository interface {
	GetUserByEmail(ctx context.Context, email string) (repository.GetUserByEmailRow, error)
	GetUserByID(ctx context.Context, id uuid.UUID) (repository.GetUserByIdRow, error)
	CreateUser(ctx context.Context, params repository.CreateUserParams) (repository.User, error)
	CreateUserWithDefaults(ctx context.Context, params repository.CreateUserParams) (repository.User, error)
	FindORCreateOAuthUser(ctx context.Context, user goth.User, provider string) (repository.GetUserByEmailRow, error)
	UpdateUser(ctx context.Context, params repository.UpdateUserParams) (repository.User, error)
	DeleteUser(ctx context.Context, id uuid.UUID) error

	GetMFASecret(ctx context.Context, userID uuid.UUID) ([]byte, error)
	EnableMFA(ctx context.Context, id uuid.UUID) error
	StoreMFASecret(ctx context.Context, params repository.StoreMFASecretParams) error
	DisableMFA(ctx context.Context, userID uuid.UUID) error

	GetLinkedAccounts(ctx context.Context, id uuid.UUID) ([]repository.GetLinkedAccountsRow, error)
	AddLinkedAccounts(ctx context.Context, params repository.AddLinkedAccountParams) error

	// UpdateUserPassword(ctx context.Context, params repository.UpdateUserPasswordParams) error
}

type repo struct {
	db      *pgxpool.Pool
	queries *repository.Queries
	storage storage.Storage
}

// NewRepository creates a new user repository
func NewRepository(db *pgxpool.Pool, queries *repository.Queries, storage storage.Storage) Repository {
	return &repo{
		db:      db,
		queries: queries,
		storage: storage,
	}
}

// GetUserByEmail retrieves a user by their email
func (r *repo) GetUserByEmail(ctx context.Context, email string) (repository.GetUserByEmailRow, error) {
	return r.queries.GetUserByEmail(ctx, email)
}

// GetUserByID retrieves a user by their ID
func (r *repo) GetUserByID(ctx context.Context, id uuid.UUID) (repository.GetUserByIdRow, error) {
	return r.queries.GetUserById(ctx, id)
}

// CreateUser creates a new user
func (r *repo) CreateUser(ctx context.Context, params repository.CreateUserParams) (repository.User, error) {
	return r.queries.CreateUser(ctx, params)
}

// CreateUserWithDefaults creates a new user and sets up their default categories in a transaction
func (r *repo) CreateUserWithDefaults(ctx context.Context, params repository.CreateUserParams) (repository.User, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return repository.User{}, err
	}

	// Ensure transaction is rolled back on error
	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(ctx); rbErr != nil && !errors.Is(rbErr, pgx.ErrTxClosed) {
				fmt.Println("Failed to roll the transaction")
			}
		}
	}()

	qtx := r.queries.WithTx(tx)

	user, err := qtx.CreateUser(ctx, params)
	if err != nil {
		return repository.User{}, err
	}

	// Create default categories
	err = qtx.CreateDefaultCategories(ctx, user.ID)
	if err != nil {
		return repository.User{}, err
	}

	// Create default preferences
	err = qtx.CreateDefaultPreferences(ctx, user.ID)
	if err != nil {
		return repository.User{}, err
	}

	// Commit the transaction
	if err = tx.Commit(ctx); err != nil {
		return repository.User{}, err
	}

	return user, nil
}

func (r *repo) FindORCreateOAuthUser(ctx context.Context, oauthUser goth.User, provider string) (repository.GetUserByEmailRow, error) {
	user, err := r.GetUserByEmail(ctx, oauthUser.Email)
	if err != nil {
		if err == pgx.ErrNoRows {
			// Parse name to first name and last name
			firstName := oauthUser.FirstName

			if firstName == "" {
				firstName = oauthUser.Name
			}

			lastName := oauthUser.LastName

			// Create user
			params := repository.CreateUserParams{
				Email:     oauthUser.Email,
				FirstName: &firstName,
				LastName:  &lastName,
			}

			newUser, err := r.CreateUserWithDefaults(ctx, params)
			if err != nil {
				return repository.GetUserByEmailRow{}, err
			}

			// Update the user profile with avatar
			if oauthUser.AvatarURL != "" {
				_, err = r.UpdateUser(ctx, repository.UpdateUserParams{
					ID:        newUser.ID,
					AvatarUrl: &oauthUser.AvatarURL,
				})
				if err != nil {
					fmt.Println("Failed to update user avatar")
				}
			}

			// Add to linked accounts
			err = r.AddLinkedAccounts(ctx, repository.AddLinkedAccountParams{
				UserID:         newUser.ID,
				Provider:       provider,
				ProviderUserID: oauthUser.UserID,
				Email:          &oauthUser.Email,
			})
			if err != nil {
				return repository.GetUserByEmailRow{}, err
			}

			// Return the user in the expected format
			return repository.GetUserByEmailRow{
				ID:        newUser.ID,
				Email:     newUser.Email,
				FirstName: newUser.FirstName,
				LastName:  newUser.LastName,
				Password:  newUser.Password,
				AvatarUrl: newUser.AvatarUrl,
				CreatedAt: newUser.CreatedAt,
				UpdatedAt: newUser.UpdatedAt,
			}, nil
		}
		return repository.GetUserByEmailRow{}, err
	}

	// User found, return it
	return user, nil
}

// UpdateUser updates an existing user
func (r *repo) UpdateUser(ctx context.Context, params repository.UpdateUserParams) (repository.User, error) {
	return r.queries.UpdateUser(ctx, params)
}

func (r *repo) GetLinkedAccounts(ctx context.Context, id uuid.UUID) ([]repository.GetLinkedAccountsRow, error) {
	return r.queries.GetLinkedAccounts(ctx, id)
}

func (r *repo) AddLinkedAccounts(ctx context.Context, params repository.AddLinkedAccountParams) error {
	return r.queries.AddLinkedAccount(ctx, params)
}

func (r *repo) StoreMFASecret(ctx context.Context, params repository.StoreMFASecretParams) error {
	return r.queries.StoreMFASecret(ctx, params)
}

func (r *repo) GetMFASecret(ctx context.Context, userID uuid.UUID) ([]byte, error) {
	return r.queries.GetMFASecret(ctx, userID)
}

func (r *repo) EnableMFA(ctx context.Context, userID uuid.UUID) error {
	return r.queries.EnableMFA(ctx, userID)
}

func (r *repo) DisableMFA(ctx context.Context, userID uuid.UUID) error {
	return r.queries.DisableMFA(ctx, userID)
}

// UpdateUserPassword updates a user's password
// func (r *repo) UpdateUserPassword(ctx context.Context, params repository.UpdateUserPasswordParams) error {
// 	return r.queries.UpdateUserPassword(ctx, params)
// }

// DeleteUser deletes a user
func (r *repo) DeleteUser(ctx context.Context, id uuid.UUID) error {
	return r.queries.DeleteUser(ctx, id)
}
