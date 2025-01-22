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
	"github.com/Fantasy-Programming/nuts/pkg/pass"
	ut "github.com/go-playground/universal-translator"
	"github.com/jackc/pgx/v5"
)

const minPasswordLength = 13

var roles = []string{"user"}

func (a *Auth) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	ctx := r.Context()
	trans := ctx.Value("translator").(ut.Translator)

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println("Login: Malformated request", err, r.Body)
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest)
		return
	}

	if err := a.validate.Validator.Struct(req); err != nil {
		validationErrors := TranslateErrors(err, trans)
		respond.Json(w, http.StatusBadRequest, validationErrors)
		return
	}

	user, err := a.queries.GetUserByEmail(ctx, req.Email)
	if err != nil {
		log.Println("Login: Failed login attempt -- ", err, req)

		if err == pgx.ErrNoRows {
			respond.Error(w, http.StatusBadRequest, ErrWrongCred)
			return
		}

		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	res, err := pass.ComparePassAndHash(req.Password, user.Password)
	if err != nil {
		log.Println("Login: Failed to call hashing function", err)
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	if !res {
		log.Println("Login: Incorrect password")
		respond.Error(w, http.StatusBadRequest, ErrWrongCred)
		return
	}

	token, err := pass.GenerateToken(user.ID, roles, a.config.SigningKey, time.Minute*30)
	if err != nil {
		log.Println("Login: Failed to generate JWT", err)
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	headerToken, signature, err := pass.SplitJWT(token)
	if err != nil {
		log.Println("Login: Failed to split JWT", err)
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
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

// TODO: Make this a transaction (create user + defaults)
func (a *Auth) Signup(w http.ResponseWriter, r *http.Request) {
	var req SignupRequest
	ctx := r.Context()
	trans := ctx.Value("translator").(ut.Translator)

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println("Signup: Malformated request", err, r.Body)
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest)
		return
	}

	if err := a.validate.Validator.Struct(req); err != nil {
		validationErrors := TranslateErrors(err, trans)
		respond.Json(w, http.StatusBadRequest, validationErrors)
		return
	}

	// check for existing user
	_, err := a.queries.GetUserByEmail(ctx, req.Email)

	if err == nil {
		log.Println(err)
		respond.Error(w, http.StatusConflict, ErrExistingUser)
		return
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		log.Println(err)
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	password, err := pass.HashPassword(req.Password, pass.DefaultParams)
	if err != nil {
		log.Println(err)
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	queryParam := repository.CreateUserParams{
		Email:    req.Email,
		Password: password,
	}

	user, err := a.queries.CreateUser(ctx, queryParam)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		log.Println(err)
		return
	}

	// Create default category

	err = a.queries.CreateDefaultCategories(ctx, user.ID)
	if err != nil {
		log.Println(err)
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	response := struct {
		message string
	}{message: "User created Successfully"}

	respond.Json(w, http.StatusCreated, response)
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
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Logged out successfully"))
}

// func isStrongPassword(password string) bool {
// 	if len(password) < minPasswordLength {
// 		return false
// 	}
// 	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString
// 	hasLower := regexp.MustCompile(`[a-z]`).MatchString
// 	hasNumber := regexp.MustCompile(`[0-9]`).MatchString
// 	hasSpecial := regexp.MustCompile(`[!@#~$%^&*()+|_.,<>?{}]`).MatchString
//
// 	return hasUpper(password) && hasLower(password) && hasNumber(password) && hasSpecial(password)
// }
