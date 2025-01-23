// This package helps in forming common Response and Errors
package respond

import (
	"encoding/json"
	"log"
	"net/http"
)

type ErrorResponse struct {
	Status  string          `json:"status"`
	Message string          `json:"message"`
	Errors  json.RawMessage `json:"errors"`
}

// Returns A pack of errors
func Errors(w http.ResponseWriter, statusCode int, message error, errors interface{}) {
	w.Header().Set("Content-Type", "application/problem+json")
	w.WriteHeader(statusCode)

	log.Println("Error: ", message, errors)

	var errData json.RawMessage

	if errors != nil {
		// Marshal errors to json.RawMessage
		data, err := json.Marshal(errors)
		if err != nil {
			log.Println("Error marshaling errors:", err)
			write(w, nil)
			return
		}
		errData = data
	}

	response := ErrorResponse{
		Status:  "error",
		Message: message.Error(),
		Errors:  errData,
	}

	writeJSON(w, response)
}

// Returns one error
func Error(w http.ResponseWriter, statusCode int, message error, err error) {
	w.Header().Set("Content-Type", "application/problem+json")
	w.WriteHeader(statusCode)
	log.Println("Error: ", err)

	response := ErrorResponse{
		Status:  "error",
		Message: message.Error(),
	}

	writeJSON(w, response)
}

// Helper function to write JSON responses
func writeJSON(w http.ResponseWriter, data interface{}) {
	res, err := json.Marshal(data)
	if err != nil {
		log.Println("Error marshaling response:", err)
		write(w, nil)
		return
	}
	write(w, res)
}

// Helper function to write response
func write(w http.ResponseWriter, data []byte) {
	_, err := w.Write(data)
	if err != nil {
		log.Println("Error writing response:", err)
	}
}
