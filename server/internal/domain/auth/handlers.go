package auth

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/pkg/pass"
	"github.com/jackc/pgx/v5"
)

func (a *Auth) Login(w http.ResponseWriter, r *http.Request) {
	var request LoginRequest

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		sendRes(w, "There seems to be some missing fields", false, http.StatusBadRequest)
		return
	}

	user, err := a.queries.GetUserByEmail(r.Context(), request.Email)
	if err != nil {
		sendRes(w, "Wrong username or password", false, http.StatusInternalServerError)
		return
	}

	res, err := pass.ComparePassAndHash(request.Password, user.Password)
	if err != nil {
		sendRes(w, "Something went wrong on our end", false, http.StatusInternalServerError)
		return
	}

	if !res {
		sendRes(w, "Wrong username or password", false, http.StatusInternalServerError)
		return
	}

	token, err := pass.GenerateToken(user.ID, a.config.SigningKey)
	if err != nil {
		sendRes(w, "Something went wrong on our end", false, http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "jwt",
		Value:    token,
		Expires:  time.Now().Add(5 * time.Minute),
		HttpOnly: true,
	})

	w.WriteHeader(http.StatusOK)
}

func (a *Auth) Signup(w http.ResponseWriter, r *http.Request) {
	var request SignupRequest

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		sendRes(w, "There seems to be some missing fields", false, http.StatusBadRequest)
		return
	}

	// check for existing user
	existingUser, err := a.queries.GetUserByEmail(r.Context(), request.Email)

	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		sendRes(w, "Something went wrong on our end", false, http.StatusInternalServerError)
		return
	}

	if existingUser.Email == request.Email {
		sendRes(w, "User already exists", false, http.StatusConflict)
		return
	}

	// Hash the password with argon2
	password, err := pass.HashPassword(request.Password, &pass.Params{
		Memory:      64 * 1024,
		Iterations:  3,
		Parallelism: 2,
		SaltLength:  16,
		KeyLength:   32,
	})
	if err != nil {
		sendRes(w, "Something went wrong on our end", false, http.StatusInternalServerError)
		return
	}

	user := repository.CreateUserParams{
		Email:    request.Email,
		Password: password,
	}

	_, err = a.queries.CreateUser(r.Context(), user)
	if err != nil {
		sendRes(w, "Something went wrong on our end", false, http.StatusInternalServerError)
		return
	}

	sendRes(w, "User created Successfully", false, http.StatusOK)
}
