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
	"github.com/Fantasy-Programming/nuts/lib/validation"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/pkg/pass"
	ut "github.com/go-playground/universal-translator"
	"github.com/jackc/pgx/v5"
)

const minPasswordLength = 13

var roles = []string{"user"}

// TODO: Improve error logging
// TODO: Translate responses too
func (a *Auth) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	ctx := r.Context()
	trans := ctx.Value("translator").(ut.Translator)

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest, err)
		return
	}

	if err := a.validate.Validator.Struct(req); err != nil {
		validationErrors := validation.TranslateErrors(err, trans)
		respond.Errors(w, http.StatusBadRequest, message.ErrValidation, validationErrors)
		return
	}

	user, err := a.queries.GetUserByEmail(ctx, req.Email)
	if err != nil {
		if err == pgx.ErrNoRows {
			respond.Error(w, http.StatusBadRequest, ErrWrongCred, err)
			return
		}

		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	res, err := pass.ComparePassAndHash(req.Password, user.Password)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	if !res {
		respond.Error(w, http.StatusBadRequest, ErrWrongCred, nil)
		return
	}

	token, err := jwt.GenerateToken(user.ID, roles, a.config.SigningKey, time.Minute*30)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	headerToken, signature, err := jwt.SplitJWT(token)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
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
	trans := ctx.Value("translator").(ut.Translator)

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest, err)
		return
	}

	if err := a.validate.Validator.Struct(req); err != nil {
		validationErrors := validation.TranslateErrors(err, trans)
		respond.Errors(w, http.StatusBadRequest, message.ErrValidation, validationErrors)
		return
	}

	// check for existing user
	_, err := a.queries.GetUserByEmail(ctx, req.Email)

	if err == nil {
		respond.Error(w, http.StatusConflict, ErrExistingUser, nil)
		return
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	password, err := pass.HashPassword(req.Password, pass.DefaultParams)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	queryParam := repository.CreateUserParams{
		Email:    req.Email,
		Password: password,
	}

	tx, err := a.db.Begin(ctx)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
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
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	// Create default category
	err = qtx.CreateDefaultCategories(ctx, user.ID)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	if err = tx.Commit(ctx); err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	respond.JsonResponse(w, http.StatusCreated, "User created Successfully", nil)
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
	respond.JsonResponse(w, http.StatusOK, "Logged out successfully", nil)
}
