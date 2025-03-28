package auth

import (
	"context"
	"errors"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/pkg/pass"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/markbates/goth"
)

// Repository defines the interface for auth-related data operations
type Repository interface {
	// GetUserByEmail retrieves a user by their email address
	GetUserByEmail(ctx context.Context, email string) (repository.GetUserByEmailRow, error)
	// CreateUser creates a new user
	CreateUser(ctx context.Context, params repository.CreateUserParams) (repository.User, error)

	FindORCreateOAuthUser(ctx context.Context, user goth.User) (repository.GetUserByEmailRow, error)
	// CreateUserWithDefaults creates a new user and sets up their default categories in a transaction
	CreateUserWithDefaults(ctx context.Context, params repository.CreateUserParams) (repository.User, error)
	// UpdateUser updates user information
	UpdateUser(ctx context.Context, params repository.UpdateUserParams) (repository.User, error)
}

type repo struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

// NewRepository creates a new auth repository
func NewRepository(db *pgxpool.Pool, queries *repository.Queries) Repository {
	return &repo{
		db:      db,
		queries: queries,
	}
}

// GetUserByEmail retrieves a user by their email address
func (r *repo) GetUserByEmail(ctx context.Context, email string) (repository.GetUserByEmailRow, error) {
	return r.queries.GetUserByEmail(ctx, email)
}

// CreateUser creates a new user
func (r *repo) CreateUser(ctx context.Context, params repository.CreateUserParams) (repository.User, error) {
	return r.queries.CreateUser(ctx, params)
}

func (r *repo) FindORCreateOAuthUser(ctx context.Context, oauthUser goth.User) (repository.GetUserByEmailRow, error) {
	user, err := r.GetUserByEmail(ctx, oauthUser.Email)
	if err != nil {
		if err == pgx.ErrNoRows {

			// User doesn't exist, create a new one with random password
			randomPassword, err := pass.GenerateRandomString(32)
			if err != nil {
				return repository.GetUserByEmailRow{}, err
			}

			hashedPassword, err := pass.HashPassword(randomPassword, pass.DefaultParams)
			if err != nil {
				return repository.GetUserByEmailRow{}, err
			}

			// Parse name to first name and last name
			firstName := oauthUser.FirstName

			if firstName == "" {
				firstName = oauthUser.Name
			}

			lastName := oauthUser.LastName

			// Create user
			params := repository.CreateUserParams{
				Email:     oauthUser.Email,
				Password:  hashedPassword,
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
					// h.log.Warn().Err(err).Msg("Failed to update user avatar")
					// Continue even if avatar update fails
				}
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
				// Log the rollback error, but return the original error
				// Consider adding structured logging here
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

	// Commit the transaction
	if err = tx.Commit(ctx); err != nil {
		return repository.User{}, err
	}

	return user, nil
}

// UpdateUser updates user information
func (r *repo) UpdateUser(ctx context.Context, params repository.UpdateUserParams) (repository.User, error) {
	return r.queries.UpdateUser(ctx, params)
}
