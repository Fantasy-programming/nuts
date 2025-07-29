package telemetry

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestHTTPMetricsMiddleware(t *testing.T) {
	// Initialize metrics
	err := InitializeMetrics()
	require.NoError(t, err, "InitializeMetrics should not return an error")

	// Create a test handler that records custom metrics
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		
		// Record some business events
		RecordAuthEvent(ctx, "login", true)
		RecordBusinessEvent(ctx, "test_event", "success")
		
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Wrap with metrics middleware
	handler := HTTPMetricsMiddleware(testHandler)

	// Create test request
	req := httptest.NewRequest("GET", "/test", nil)
	rr := httptest.NewRecorder()

	// Execute request
	handler.ServeHTTP(rr, req)

	// Check response
	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, "OK", rr.Body.String())
}

func TestHTTPMetricsMiddlewareWithError(t *testing.T) {
	// Initialize metrics
	err := InitializeMetrics()
	require.NoError(t, err, "InitializeMetrics should not return an error")

	// Create a test handler that returns an error
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		
		// Record an error
		RecordError(ctx, "test_error", "test.handler")
		RecordAuthEvent(ctx, "login", false)
		
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Internal Server Error"))
	})

	// Wrap with metrics middleware
	handler := HTTPMetricsMiddleware(testHandler)

	// Create test request
	req := httptest.NewRequest("POST", "/test-error", nil)
	rr := httptest.NewRecorder()

	// Execute request
	handler.ServeHTTP(rr, req)

	// Check response
	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Equal(t, "Internal Server Error", rr.Body.String())
}

func TestMetricsWithoutInitialization(t *testing.T) {
	// Reset global instruments to test behavior without initialization
	oldInstruments := globalInstruments
	globalInstruments = nil
	defer func() {
		globalInstruments = oldInstruments
	}()

	// Create a test handler
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		
		// These should not panic even without initialization
		metrics := NewRequestMetrics(ctx, "GET", "test.handler")
		RecordError(ctx, "test_error", "test.handler")
		RecordAuthEvent(ctx, "login", true)
		metrics.End(200)
		
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Wrap with metrics middleware
	handler := HTTPMetricsMiddleware(testHandler)

	// Create test request
	req := httptest.NewRequest("GET", "/test", nil)
	rr := httptest.NewRecorder()

	// Execute request - should not panic
	handler.ServeHTTP(rr, req)

	// Check response
	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, "OK", rr.Body.String())
}