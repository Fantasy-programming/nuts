package auth

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"time"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/pkg/pass"
	"github.com/jackc/pgx/v5"
	"github.com/markbates/goth/gothic"
	"github.com/rs/zerolog"
)

var roles = []string{"user"}

var (
	ErrWrongCred     = errors.New("auth.wrong_credentials")
	ErrEmailRequired = errors.New("auth.email_required")
	ErrPasswordReq   = errors.New("auth.password_critera")
	ErrExistingUser  = errors.New("auth.user_exists")
)

type Handler struct {
	v    *validation.Validator
	tkn  *jwt.Service
	repo Repository
	log  *zerolog.Logger
}

func NewHandler(validator *validation.Validator, tokenService *jwt.Service, repo Repository, logger *zerolog.Logger) *Handler {
	return &Handler{validator, tokenService, repo, logger}
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	ctx := r.Context()

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.log,
			Details:    r.Body,
		})
		return
	}

	if err := h.v.Validator.Struct(req); err != nil {
		// validationErrors := validation.TranslateErrors(ctx, err)
		respond.Errors(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrValidation,
			ActualErr:  err,
			Logger:     h.log,
			Details:    req,
		})
		return
	}

	user, err := h.repo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		if err == pgx.ErrNoRows {
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusBadRequest,
				ClientErr:  ErrWrongCred,
				ActualErr:  err,
				Logger:     h.log,
				Details:    user,
			})
			return
		}

		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    req,
		})
		return
	}

	res, err := pass.ComparePassAndHash(req.Password, user.Password)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    req,
		})
		return
	}

	if !res {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  ErrWrongCred,
			ActualErr:  nil,
			Logger:     h.log,
			Details:    nil,
		})
		return
	}

	tokenPair, err := h.tkn.GenerateTokenPair(ctx, user.ID, roles)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    req,
		})
		return
	}

	secure := os.Getenv("ENVIRONMENT") == "production"

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    tokenPair.AccessToken,
		HttpOnly: true,
		Path:     "/",
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(15 * time.Minute),
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    tokenPair.RefreshToken,
		HttpOnly: true,
		Path:     "/",
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
	})

	respond.Status(w, http.StatusOK)
}

func (h *Handler) Signup(w http.ResponseWriter, r *http.Request) {
	var req SignupRequest
	ctx := r.Context()

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	if err := h.v.Validator.Struct(req); err != nil {
		// validationErrors := validation.TranslateErrors(ctx, err)
		respond.Errors(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrValidation,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	// check for existing user
	_, err := h.repo.GetUserByEmail(ctx, req.Email)

	if err == nil {
		respond.Error(respond.ErrorOptions{
			R:          r,
			W:          w,
			StatusCode: http.StatusConflict,
			ClientErr:  ErrExistingUser,
			ActualErr:  nil,
			Logger:     h.log,
		})
		return
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	password, err := pass.HashPassword(req.Password, pass.DefaultParams)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	queryParam := repository.CreateUserParams{
		Email:    req.Email,
		Password: password,
	}

	_, err = h.repo.CreateUserWithDefaults(ctx, queryParam)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	respond.Json(w, http.StatusCreated, nil, h.log)
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Get refresh token from cookie
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusUnauthorized,
			ClientErr:  jwt.ErrNoTokenFound,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	// Get new token pair
	tokenPair, err := h.tkn.RefreshAccessToken(ctx, cookie.Value)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if errors.Is(err, jwt.ErrUnauthorized) || errors.Is(err, jwt.ErrInvalidToken) {
			statusCode = http.StatusUnauthorized
		}

		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: statusCode,
			ClientErr:  err,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	secure := false

	host := os.Getenv("ENVIRONMENT")

	if host == "production" {
		secure = true
	}

	// Set new cookies
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    tokenPair.AccessToken,
		HttpOnly: true,
		Path:     "/",
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(15 * time.Minute),
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    tokenPair.RefreshToken,
		HttpOnly: true,
		Path:     "/",
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
	})

	respond.Json(w, http.StatusOK, nil, h.log)
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	secure := os.Getenv("ENVIRONMENT") == "production"

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   secure,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   secure,
	})

	// Respond with a success message
	respond.Json(w, http.StatusOK, nil, h.log)
}

func (h *Handler) GoogleHandler(w http.ResponseWriter, r *http.Request) {
	gothic.BeginAuthHandler(w, r)
}

func (h *Handler) GoogleCallbackHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user, err := gothic.CompleteUserAuth(w, r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusUnauthorized,
			ClientErr:  message.ErrForbidden,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	// Save user to the database
	dbUser, err := h.repo.FindORCreateOAuthUser(ctx, user)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	// Generate JWT token
	tokenPair, err := h.tkn.GenerateTokenPair(ctx, dbUser.ID, roles)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	// Generate tokens for the user
	secure := os.Getenv("ENVIRONMENT") == "production"

	// Set cookies with tokens
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    tokenPair.AccessToken,
		HttpOnly: true,
		Path:     "/",
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(15 * time.Minute),
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    tokenPair.RefreshToken,
		HttpOnly: true,
		Path:     "/",
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
	})

	// Redirect to the secure area
	redirectURL := os.Getenv("REDIRECT_SECURE")

	if redirectURL == "" {
		redirectURL = "http://localhost:5173/dashboard"
	}

	http.Redirect(w, r, redirectURL, http.StatusFound)
}
