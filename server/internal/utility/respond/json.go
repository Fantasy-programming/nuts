package respond

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/utility/message"
)

// Marshal and write JSON
func Json(w http.ResponseWriter, statusCode int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	// Handle nil payload
	if payload == nil {
		_, _ = w.Write([]byte("{}"))
		return
	}

	// Marshal payload
	data, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Error marshaling payload: %v\n", err)
		Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	// Handle JSON "null" by writing an empty array instead
	if string(data) == "null" {
		_, _ = w.Write([]byte("[]"))
		return
	}

	// Write JSON data
	if _, err := w.Write(data); err != nil {
		log.Printf("Error writing response: %v\n", err)
		Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
	}
}

// Response structure for consistent API responses
type Response struct {
	Status  string      `json:"status"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message"`
}

// Write a structured JSON response
func JsonResponse(w http.ResponseWriter, statusCode int, msg string, data interface{}) {
	Json(w, statusCode, Response{
		Status:  "success",
		Message: msg,
		Data:    data,
	})
}
