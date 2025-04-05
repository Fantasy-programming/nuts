package user

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"

	"github.com/Fantasy-Programming/nuts/config"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/pkg/storage"
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

	respond.Json(w, http.StatusOK, &GetUserResponse{
		AvatarUrl: user.AvatarUrl,
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
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

	// Generate avatar URL
	avatarURL := fmt.Sprintf("http://localhost:9000/%s/%s", h.cfg.PublicBucketName, filename)

	// Update user in database with new avatar URL
	params := repository.UpdateUserParams{
		ID:        id,
		AvatarUrl: &avatarURL,
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

	// Return success response with avatar URL
	respond.Json(w, http.StatusOK, map[string]string{
		"avatar_url": *user.AvatarUrl,
	}, h.logger)
}
