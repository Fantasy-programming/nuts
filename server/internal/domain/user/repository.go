package user

import (
	"context"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/pkg/storage"
	"github.com/google/uuid"
)

// Repository defines the interface for user data operations
type Repository interface {
	GetUserByEmail(ctx context.Context, email string) (repository.GetUserByEmailRow, error)
	GetUserByID(ctx context.Context, id uuid.UUID) (repository.GetUserByIdRow, error)
	CreateUser(ctx context.Context, params repository.CreateUserParams) (repository.User, error)
	UpdateUser(ctx context.Context, params repository.UpdateUserParams) (repository.User, error)
	// UpdateUserPassword(ctx context.Context, params repository.UpdateUserPasswordParams) error
	DeleteUser(ctx context.Context, id uuid.UUID) error
}

type repo struct {
	queries *repository.Queries
	storage *storage.Storage
}

// NewRepository creates a new user repository
func NewRepository(queries *repository.Queries, storage *storage.Storage) Repository {
	return &repo{
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

// UpdateUser updates an existing user
func (r *repo) UpdateUser(ctx context.Context, params repository.UpdateUserParams) (repository.User, error) {
	return r.queries.UpdateUser(ctx, params)
}

// UpdateUserPassword updates a user's password
// func (r *repo) UpdateUserPassword(ctx context.Context, params repository.UpdateUserPasswordParams) error {
// 	return r.queries.UpdateUserPassword(ctx, params)
// }

// DeleteUser deletes a user
func (r *repo) DeleteUser(ctx context.Context, id uuid.UUID) error {
	return r.queries.DeleteUser(ctx, id)
}
