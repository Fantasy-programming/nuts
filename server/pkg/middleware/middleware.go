package middleware

import (
	"log"
	"net/http"
	"runtime/debug"
	"time"
)

// Recovery middleware to handle panics in HTTP handlers
func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("PANIC: %v\n%s", err, debug.Stack())
				http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// Logger middleware for request logging
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Create a response wrapper to capture the status code
		lw := &responseWriter{ResponseWriter: w, statusCode: 200}

		next.ServeHTTP(lw, r)

		log.Printf("%s %s %d %s", r.Method, r.URL.Path, lw.statusCode, time.Since(start))
	})
}

// responseWriter is a wrapper for http.ResponseWriter to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(statusCode int) {
	rw.statusCode = statusCode
	rw.ResponseWriter.WriteHeader(statusCode)
}
