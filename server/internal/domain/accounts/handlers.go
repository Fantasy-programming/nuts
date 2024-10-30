package accounts

import (
	"encoding/json"
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/middleware/jwtauth"
	"github.com/google/uuid"
)

func (a *Account) GetAccounts(w http.ResponseWriter, r *http.Request) {
	_, claims, _ := jwtauth.FromContext(r.Context())

	idStr := claims["id"].(string)

	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "fuck something went wrong", http.StatusInternalServerError)
		return
	}

	account, err := a.queries.GetAccounts(r.Context(), &id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	payload, err := json.Marshal(account)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	w.WriteHeader(http.StatusOK)
	w.Write(payload)
}

func (a *Account) GetAccount(w http.ResponseWriter, r *http.Request)    {}
func (a *Account) CreateAccount(w http.ResponseWriter, r *http.Request) {}
func (a *Account) UpdateAccount(w http.ResponseWriter, r *http.Request) {}
func (a *Account) DeleteAccount(w http.ResponseWriter, r *http.Request) {}
