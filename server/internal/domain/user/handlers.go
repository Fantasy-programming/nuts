package user

import (
	"encoding/json"
	"net/http"
	"path/filepath"
	"time"

	"github.com/Fantasy-Programming/nuts/server/config"
	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/storage"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

type Handler struct {
	cfg     *config.Config
	v       *validation.Validator
	repo    Repository
	storage storage.Storage
	logger  *zerolog.Logger
}

func NewHandler(config *config.Config, validator *validation.Validator, repo Repository, storage storage.Storage, logger *zerolog.Logger) *Handler {
	return &Handler{config, validator, repo, storage, logger}
}

func (h *Handler) GetInfo(w http.ResponseWriter, r *http.Request) {
	id, err := jwt.GetUserID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	user, err := h.repo.GetUserByID(ctx, id)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    id,
		})
		return
	}

	act, err := h.repo.GetLinkedAccounts(ctx, id)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    id,
		})
		return
	}

	hasPassword := user.Password != nil
	hasKey := user.AvatarKey != nil

	avatar_url := user.AvatarUrl

	if hasKey {
		avatar_url_tmp, err := h.storage.GenerateGetSignedURL(ctx, h.cfg.PublicBucketName, *user.AvatarKey, time.Minute*5)

		if err != nil {
			h.logger.Error().Err(err).Any("avatar_key", user.AvatarKey).Msg("failed to get avatar_url while key exist")
		} else {
			avatar_url = &avatar_url_tmp
		}
	}

	respond.Json(w, http.StatusOK, &GetUserResponse{
		AvatarUrl:  avatar_url,
		Email:      user.Email,
		FirstName:  user.FirstName,
		LastName:   user.LastName,
		MfaEnabled: user.MfaEnabled,
		CreatedAt:  user.CreatedAt,
		UpdatedAt:  user.UpdatedAt,

		LinkedAccounts: &act,
		HasPassword:    hasPassword,
	}, h.logger)
}

func (h *Handler) UpdateInfo(w http.ResponseWriter, r *http.Request) {
	id, err := jwt.GetUserID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	var req UpdateUserRequest

	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    r.Body,
		})
		return
	}

	// Validate and parse
	if err := h.v.Validator.Struct(req); err != nil {
		// validationErrors := validation.TranslateErrors(ctx, err)
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrValidation,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    req,
		})
		return
	}

	params := repository.UpdateUserParams{
		Email:     &req.Email,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		ID:        id,
	}

	user, err := h.repo.UpdateUser(ctx, params)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    id,
		})
		return
	}

	respond.Json(w, http.StatusOK, &GetUserResponse{
		AvatarUrl: user.AvatarUrl,
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}, h.logger)
}

func (h *Handler) DeleteInfo(w http.ResponseWriter, r *http.Request) {
	id, err := jwt.GetUserID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	err = h.repo.DeleteUser(ctx, id)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    id,
		})
		return
	}

	respond.Status(w, http.StatusOK)
}

// UploadAvatar handles avatar image uploads
func (h *Handler) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	id, err := jwt.GetUserID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	// Parse multipart form with 5MB max size
	if err := r.ParseMultipartForm(5 << 20); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    "Failed to parse form",
		})
		return
	}

	// Get file from form
	file, handler, err := r.FormFile("avatar")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    "No avatar file found in request",
		})
		return
	}
	defer file.Close()

	// Create a unique filename
	ext := filepath.Ext(handler.Filename)
	size := handler.Size
	filename := uuid.New().String() + ext

	// Upload file to S3

	err = h.storage.Upload(ctx, h.cfg.PublicBucketName, filename, size, file)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    "Failed to create file on s3",
		})
		return
	}

	// avatarURL := fmt.Sprintf("http://localhost:9000/%s/%s", h.cfg.PublicBucketName, filename)

	// Update user in database with new avatar URL
	params := repository.UpdateUserParams{
		ID:        id,
		AvatarKey: &filename,
	}

	_, err = h.repo.UpdateUser(ctx, params)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    id,
		})
		return
	}

	// Generate avatar URL
	avatarURL, err := h.storage.GenerateGetSignedURL(ctx, h.cfg.PublicBucketName, filename, time.Minute*5)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    "Failed to get signedURL",
		})
		return
	}

	// Return success response with avatar URL
	respond.Json(w, http.StatusOK, map[string]string{
		"avatar_url": avatarURL,
	}, h.logger)
}
