package service

import (
	"context"
	"errors"
	"fmt"
	"io"
	"path/filepath"
	"time"

	"github.com/Fantasy-Programming/nuts/server/config"
	authRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/auth/repository"
	ctgRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/categories/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/user"
	userRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/user/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/pkg/storage"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// TODO: Remove the response from this layer
type Users interface {
	GetUserInfo(ctx context.Context, id uuid.UUID) (user.GetUserResponse, error)
	UpdateUserInfo(ctx context.Context, params repository.UpdateUserParams) (user.GetUserResponse, error)
	CreateUserWithDefaults(ctx context.Context, params repository.CreateUserParams) (repository.User, error)
	UpdateUserAvatar(ctx context.Context, userID uuid.UUID, originalFilename string, size int64, file io.Reader) (string, error)
	DeleteUser(ctx context.Context, id uuid.UUID) error

	GetUserPreferences(ctx context.Context, userID uuid.UUID) (repository.GetPreferencesByUserIdRow, error)
	UpdatePreferences(ctx context.Context, params repository.UpdatePreferencesParams) (repository.Preference, error)
}

type UserService struct {
	userRepo userRepo.Users
	ctgRepo  ctgRepo.Category
	athRepo  authRepo.Auth
	db       *pgxpool.Pool
	storage  storage.Storage
	config   *config.Config
}

func New(db *pgxpool.Pool, storage storage.Storage, config *config.Config, userRepo userRepo.Users, athRepo authRepo.Auth, ctgRepo ctgRepo.Category) *UserService {
	return &UserService{
		userRepo: userRepo,
		athRepo:  athRepo,
		ctgRepo:  ctgRepo,
		db:       db,
		storage:  storage,
		config:   config,
	}
}

func (s *UserService) GetUserInfo(ctx context.Context, id uuid.UUID) (user.GetUserResponse, error) {
	userData, err := s.userRepo.GetUserByID(ctx, id)
	if err != nil {
		return user.GetUserResponse{}, err
	}

	accounts, err := s.athRepo.GetLinkedAccounts(ctx, id)
	if err != nil {
		return user.GetUserResponse{}, err
	}

	hasPassword := userData.Password != nil
	hasKey := userData.AvatarKey != nil

	avatar_url := userData.AvatarUrl

	if hasKey {
		avatar_url_tmp, err := s.storage.GenerateGetSignedURL(ctx, s.config.PublicBucketName, *userData.AvatarKey, time.Minute*5)

		if err != nil {
			// s.logger.Error().Err(err).Any("avatar_key", userData.AvatarKey).Msg("failed to get avatar_url while key exist")
		} else {
			avatar_url = &avatar_url_tmp
		}
	}

	return user.GetUserResponse{
		AvatarUrl:  avatar_url,
		Email:      userData.Email,
		FirstName:  userData.FirstName,
		LastName:   userData.LastName,
		MfaEnabled: userData.MfaEnabled,
		CreatedAt:  userData.CreatedAt,
		UpdatedAt:  userData.UpdatedAt,

		LinkedAccounts: &accounts,
		HasPassword:    hasPassword,
	}, nil
}

func (s *UserService) UpdateUserInfo(ctx context.Context, params repository.UpdateUserParams) (user.GetUserResponse, error) {
	userData, err := s.userRepo.UpdateUser(ctx, params)
	if err != nil {
		return user.GetUserResponse{}, err
	}

	return user.GetUserResponse{
		AvatarUrl: userData.AvatarUrl,
		Email:     userData.Email,
		FirstName: userData.FirstName,
		LastName:  userData.LastName,
		CreatedAt: userData.CreatedAt,
		UpdatedAt: userData.UpdatedAt,
	}, nil
}

func (s *UserService) UpdateUserAvatar(
	ctx context.Context,
	userID uuid.UUID,
	originalFilename string,
	size int64,
	file io.Reader,
) (string, error) {
	ext := filepath.Ext(originalFilename)
	filename := uuid.New().String() + ext

	if err := s.storage.Upload(ctx, s.config.PublicBucketName, filename, size, file); err != nil {
		return "", fmt.Errorf("upload avatar to s3: %w", err)
	}

	// 2. Update DB with avatar key
	if _, err := s.userRepo.UpdateUser(ctx, repository.UpdateUserParams{
		ID:        userID,
		AvatarKey: &filename,
	}); err != nil {
		return "", fmt.Errorf("update user avatar: %w", err)
	}

	// 3. Generate signed URL
	url, err := s.storage.GenerateGetSignedURL(ctx, s.config.PublicBucketName, filename, 5*time.Minute)
	if err != nil {
		return "", fmt.Errorf("generate avatar URL: %w", err)
	}

	return url, nil
}

func (s *UserService) DeleteUser(ctx context.Context, id uuid.UUID) error {
	return s.userRepo.DeleteUser(ctx, id)
}

func (s *UserService) CreateUserWithDefaults(ctx context.Context, params repository.CreateUserParams) (repository.User, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return repository.User{}, err
	}

	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(ctx); rbErr != nil && !errors.Is(rbErr, pgx.ErrTxClosed) {
				fmt.Println("Failed to roll the transaction")
			}
		}
	}()

	usrtx := s.userRepo.WithTx(tx)
	ctgx := s.ctgRepo.WithTx(tx)

	user, err := usrtx.CreateUser(ctx, params)
	if err != nil {
		return repository.User{}, err
	}

	// Create default categories
	err = ctgx.CreateDefaultCategories(ctx, user.ID)
	if err != nil {
		return repository.User{}, err
	}

	// Create default preferences
	err = usrtx.CreateDefaultPreferences(ctx, user.ID)
	if err != nil {
		return repository.User{}, err
	}

	// Commit the transaction
	if err = tx.Commit(ctx); err != nil {
		return repository.User{}, err
	}

	return user, nil
}

func (r *UserService) GetUserPreferences(ctx context.Context, userID uuid.UUID) (repository.GetPreferencesByUserIdRow, error) {
	return r.userRepo.GetUserPreferences(ctx, userID)
}

func (r *UserService) UpdatePreferences(ctx context.Context, params repository.UpdatePreferencesParams) (repository.Preference, error) {
	return r.userRepo.UpdatePreferences(ctx, params)
}
