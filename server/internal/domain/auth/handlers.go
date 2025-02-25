package auth

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/Fantasy-Programming/nuts/internal/middleware/jwtauth"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/pkg/pass"
	"github.com/jackc/pgx/v5"
)

var roles = []string{"user"}

var (
	ErrWrongCred     = errors.New("auth.wrong_credentials")
	ErrEmailRequired = errors.New("email is required")
	ErrPasswordReq   = errors.New("password doesn't meet the critera")
	ErrExistingUser  = errors.New("user already exists")
)

// TODO: Improve error logging
// TODO: Translate responses too
func (a *Auth) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	ctx := r.Context()

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     a.log,
			Details:    r.Body,
		})
		return
	}

	if err := a.v.Validator.Struct(req); err != nil {
		// validationErrors := validation.TranslateErrors(ctx, err)
		respond.Errors(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrValidation,
			ActualErr:  err,
			Logger:     a.log,
			Details:    req,
		})
		return
	}

	user, err := a.queries.GetUserByEmail(ctx, req.Email)
	if err != nil {
		if err == pgx.ErrNoRows {
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusBadRequest,
				ClientErr:  ErrWrongCred,
				ActualErr:  err,
				Logger:     a.log,
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
			Logger:     a.log,
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
			Logger:     a.log,
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
			Logger:     a.log,
			Details:    nil,
		})
		return
	}

	token, err := jwt.GenerateToken(user.ID, roles, a.config.SigningKey, time.Minute*30)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
			Details:    req,
		})
		return
	}

	headerToken, signature, err := jwt.SplitJWT(token)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
			Details:    req,
		})
		return
	}

	// Header+Payload
	http.SetCookie(w, &http.Cookie{
		Name:     jwtauth.CookieHeader,
		Value:    headerToken,
		Path:     "/",
		Expires:  time.Now().Add(30 * time.Minute),
		SameSite: http.SameSiteStrictMode,
		// Secure:  true,
	})

	// Signature
	http.SetCookie(w, &http.Cookie{
		Name:     jwtauth.CookieSignature,
		Value:    signature,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
		// Secure:   true,
	})

	respond.Status(w, http.StatusOK)
}

func (a *Auth) Signup(w http.ResponseWriter, r *http.Request) {
	var req SignupRequest
	ctx := r.Context()

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     a.log,
		})
		return
	}

	if err := a.v.Validator.Struct(req); err != nil {
		// validationErrors := validation.TranslateErrors(ctx, err)
		respond.Errors(respond.ErrorOptions{
			W:          w,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrValidation,
			ActualErr:  err,
			Logger:     a.log,
		})
		return
	}

	// check for existing user
	_, err := a.queries.GetUserByEmail(ctx, req.Email)

	if err == nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			StatusCode: http.StatusConflict,
			ClientErr:  ErrExistingUser,
			ActualErr:  nil,
			Logger:     a.log,
		})
		return
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		respond.Error(respond.ErrorOptions{
			W:          w,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
		})
		return
	}

	password, err := pass.HashPassword(req.Password, pass.DefaultParams)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
		})
		return
	}

	queryParam := repository.CreateUserParams{
		Email:    req.Email,
		Password: password,
	}

	tx, err := a.db.Begin(ctx)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
		})
		return
	}

	defer func() {
		if err := tx.Rollback(ctx); err != nil && err != pgx.ErrTxClosed {
			log.Println("Signup: Failed to rollback transaction", err)
		}
	}()

	qtx := a.queries.WithTx(tx)

	user, err := qtx.CreateUser(ctx, queryParam)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
		})
		return
	}

	// Create default category
	err = qtx.CreateDefaultCategories(ctx, user.ID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
		})
		return
	}

	if err = tx.Commit(ctx); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
		})
		return
	}

	respond.Json(w, http.StatusCreated, nil, a.log)
}

func (a *Auth) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     jwtauth.CookieHeader,
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		// Secure:   true,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     jwtauth.CookieSignature,
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		// Secure:   true,
	})

	// Respond with a success message
	respond.Json(w, http.StatusOK, nil, a.log)
}
