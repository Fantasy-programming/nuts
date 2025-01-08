package auth

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"regexp"
	"time"

	"github.com/Fantasy-Programming/nuts/internal/middleware/jwtauth"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
	"github.com/Fantasy-Programming/nuts/pkg/pass"
	"github.com/jackc/pgx/v5"
)

const minPasswordLength = 13

var (
	ErrDefaultFailure = errors.New("Wrong email or password")
	ErrEmailRequired  = errors.New("email is required")
	ErrPassword       = errors.New("password doesn't meet the critera")
	ErrExistingUser   = errors.New("user already exists")
)

func (a *Auth) Login(w http.ResponseWriter, r *http.Request) {
	var request LoginRequest
	roles := []string{"user"}

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		log.Println("Login: Malformated request", err, r.Body)
		respond.Error(w, http.StatusBadRequest, nil)
		return
	}

	user, err := a.queries.GetUserByEmail(r.Context(), request.Email)

	if err != nil || user.Email != request.Email {
		log.Println("Login: Failed login attempt", err, request)
		respond.Error(w, http.StatusInternalServerError, ErrDefaultFailure)
		return
	}

	res, err := pass.ComparePassAndHash(request.Password, user.Password)
	if err != nil {
		log.Println("Login: Incorrect password", err)
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	if !res {
		log.Println("Login: Incorrect password")
		respond.Error(w, http.StatusInternalServerError, ErrDefaultFailure)
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

	respond.Json(w, http.StatusOK, map[string]string{"message": "Login successful"})
}

// TODO: Make this a transaction (create user + defaults)
func (a *Auth) Signup(w http.ResponseWriter, r *http.Request) {
	var request SignupRequest

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest)
		log.Println(err)
		return
	}

	// Validate the Request

	if request.Email == "" {
		respond.Error(w, http.StatusBadRequest, ErrEmailRequired)
		log.Println(err)
		return
	}

	if !isStrongPassword(request.Password) {
		respond.Error(w, http.StatusBadRequest, ErrPassword)
		log.Println(err)
		return
	}

	// check for existing user
	existingUser, err := a.queries.GetUserByEmail(r.Context(), request.Email)

	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		log.Println(err)
		return
	}

	if existingUser.Email == request.Email {
		respond.Error(w, http.StatusConflict, ErrExistingUser)
		log.Println(err)
		return
	}

	password, err := pass.HashPassword(request.Password, pass.DefaultParams)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		log.Println(err)
		return
	}

	queryParam := repository.CreateUserParams{
		Email:    request.Email,
		Password: password,
	}

	user, err := a.queries.CreateUser(r.Context(), queryParam)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		log.Println(err)
		return
	}

	// Create default category

	err = a.queries.CreateDefaultCategories(r.Context(), user.ID)
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

func isStrongPassword(password string) bool {
	if len(password) < minPasswordLength {
		return false
	}
	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString
	hasLower := regexp.MustCompile(`[a-z]`).MatchString
	hasNumber := regexp.MustCompile(`[0-9]`).MatchString
	hasSpecial := regexp.MustCompile(`[!@#~$%^&*()+|_.,<>?{}]`).MatchString

	return hasUpper(password) && hasLower(password) && hasNumber(password) && hasSpecial(password)
}
