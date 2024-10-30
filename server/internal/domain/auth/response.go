package auth

import (
	"encoding/json"
	"net/http"
)

type SignupResponse struct {
	Message string `json:"message"`
	Success bool   `json:"success"`
}

func sendRes(w http.ResponseWriter, message string, success bool, code int) {
	response := SignupResponse{
		Message: message,
		Success: success,
	}

	payload, err := json.Marshal(response)
	if err != nil {
		http.Error(w, message, code)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(payload)
}
