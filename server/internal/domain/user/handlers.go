package user

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

func (u *User) GetInfo(w http.ResponseWriter, r *http.Request) {
	id, err := jwt.GetID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     u.log,
			Details:    nil,
		})
		return
	}

	user, err := u.queries.GetUserById(ctx, id)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     u.log,
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
	}, u.log)
}

func (u *User) UpdateInfo(w http.ResponseWriter, r *http.Request) {
	id, err := jwt.GetID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     u.log,
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
			Logger:     u.log,
			Details:    r.Body,
		})
		return
	}

	// Validate and parse
	if err := u.v.Validator.Struct(req); err != nil {
		// validationErrors := validation.TranslateErrors(ctx, err)
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrValidation,
			ActualErr:  err,
			Logger:     u.log,
			Details:    req,
		})
		return
	}

	u.log.Debug().Interface("debug ", req)

	params := repository.UpdateUserParams{
		Email:     &req.Email,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		ID:        id,
	}

	fmt.Println(req.FirstName, req.LastName)

	user, err := u.queries.UpdateUser(ctx, params)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     u.log,
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
	}, u.log)
}

func (u *User) DeleteInfo(w http.ResponseWriter, r *http.Request) {
	id, err := jwt.GetID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     u.log,
			Details:    nil,
		})
		return
	}

	err = u.queries.DeleteUser(ctx, id)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     u.log,
			Details:    id,
		})
		return
	}

	respond.Status(w, http.StatusOK)
}

// UploadAvatar handles avatar image uploads
func (u *User) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	id, err := jwt.GetID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     u.log,
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
			Logger:     u.log,
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
			Logger:     u.log,
			Details:    "No avatar file found in request",
		})
		return
	}
	defer file.Close()

	// Create a unique filename
	ext := filepath.Ext(handler.Filename)
	filename := uuid.New().String() + ext

	// Upload file to S3

	_, err = u.storage.Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: &u.storage.Bucket,
		Key:    &filename,
		Body:   file,
	})
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     u.log,
			Details:    "Failed to create file on s3",
		})
		return
	}

	// Generate avatar URL
	avatarURL := fmt.Sprintf("http://localhost:9000/%s/%s", u.storage.Bucket, filename)

	// Update user in database with new avatar URL
	params := repository.UpdateUserParams{
		ID:        id,
		AvatarUrl: &avatarURL,
	}

	user, err := u.queries.UpdateUser(ctx, params)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     u.log,
			Details:    id,
		})
		return
	}

	// Return success response with avatar URL
	respond.Json(w, http.StatusOK, map[string]string{
		"avatar_url": *user.AvatarUrl,
	}, u.log)
}
