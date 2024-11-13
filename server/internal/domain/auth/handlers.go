package auth

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"regexp"
	"time"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
	"github.com/Fantasy-Programming/nuts/pkg/pass"
	"github.com/jackc/pgx/v5"
)

const (
	minPasswordLength = 13
)

var (
	ErrDefaultFailure = errors.New("Wrong email or password")
	ErrEmailRequired  = errors.New("email is required")
	ErrPassword       = errors.New("password doesn't meet the critera")
	ErrExistingUser   = errors.New("user already exists")
)

func (a *Auth) Login(w http.ResponseWriter, r *http.Request) {
	var request LoginRequest

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		respond.Error(w, http.StatusBadRequest, nil)
		return
	}

	user, err := a.queries.GetUserByEmail(r.Context(), request.Email)

	if err != nil || user.Email != request.Email {
		respond.Error(w, http.StatusInternalServerError, ErrDefaultFailure)
		return
	}

	res, err := pass.ComparePassAndHash(request.Password, user.Password)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	if !res {
		respond.Error(w, http.StatusInternalServerError, ErrDefaultFailure)
		return
	}

	token, err := pass.GenerateToken(user.ID, a.config.SigningKey, time.Minute*5)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	rtoken, err := pass.GenerateToken(user.ID, a.config.RefreshKey, time.Hour*24*7)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "nutsToken",
		Value:    rtoken,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
		HttpOnly: true,
	})

	respond.Json(w, http.StatusOK, LoginResponse{
		Token: token,
		User: UserProfile{
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			CreatedAt: user.CreatedAt,
			UpdatedAt: user.UpdatedAt,
		},
	})
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
		Name:     "nutsToken",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   true,
	})

	// Respond with a success message
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Logged out successfully"))
}

func (a *Auth) Refresh(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("nutsToken")
	if err != nil {
		http.Error(w, "Refresh token not found", http.StatusUnauthorized)
		return
	}

	refreshToken := cookie.Value

	// we verify that the refreshtoken hasn't expired
	claims, err := pass.VerifyRefreshToken(refreshToken, a.config.RefreshKey)
	if err != nil {
		http.Error(w, "Invalid or expired refresh token", http.StatusUnauthorized)
		return
	}

	// Generate Access token
	accessToken, err := pass.GenerateToken(claims.UserId, a.config.SigningKey, time.Minute*5)
	if err != nil {
		http.Error(w, "Failed to generate refresh token", http.StatusInternalServerError)
		return
	}

	// NOTE: we should verify that the user is still active
	// we generate a new access token + new refresh token (new refresh token is made if it will expire in 2 or less days)

	if claims.ExpiresAt.Time.Sub(time.Now()) <= 48*time.Hour {
		newRefreshToken, err := pass.GenerateToken(claims.UserId, a.config.RefreshKey, time.Hour*24*7)
		if err != nil {
			http.Error(w, "Failed to generate refresh token", http.StatusInternalServerError)
			return
		}

		http.SetCookie(w, &http.Cookie{
			Name:     "nutsToken",
			Value:    newRefreshToken,
			Path:     "/",
			Expires:  time.Now().Add(7 * 24 * time.Hour), // Set the expiration time as needed
			HttpOnly: true,
			// Secure:   true,
		})
	}

	respond.Json(w, http.StatusOK, map[string]string{
		"token": accessToken,
	})
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
