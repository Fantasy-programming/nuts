package telemetry

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"go.opentelemetry.io/otel"
)

// Global metrics instance
var globalInstruments *Instruments

// InitializeMetrics sets up the global metrics instruments
func InitializeMetrics() error {
	meter := otel.Meter("nuts-backend")
	
	instruments, err := NewInstruments(meter)
	if err != nil {
		return err
	}
	
	globalInstruments = instruments
	return nil
}

// RequestMetrics is a helper struct for measuring HTTP requests
type RequestMetrics struct {
	start   time.Time
	ctx     context.Context
	method  string
	handler string
}

// NewRequestMetrics creates a new RequestMetrics instance
func NewRequestMetrics(ctx context.Context, method, handler string) *RequestMetrics {
	return &RequestMetrics{
		start:   time.Now(),
		ctx:     ctx,
		method:  method,
		handler: handler,
	}
}

// End completes the request measurement
func (rm *RequestMetrics) End(statusCode int) {
	if rm == nil || globalInstruments == nil {
		return
	}
	
	duration := time.Since(rm.start).Seconds()
	status := strconv.Itoa(statusCode)
	
	globalInstruments.RecordHTTPRequest(rm.ctx, rm.method, rm.handler, status, duration)
}

// RecordError records an error metric with global instruments
func RecordError(ctx context.Context, errorType, handler string) {
	if globalInstruments != nil {
		globalInstruments.RecordError(ctx, errorType, handler)
	}
}

// RecordBusinessEvent records a business event metric with global instruments
func RecordBusinessEvent(ctx context.Context, eventType, outcome string) {
	if globalInstruments != nil {
		globalInstruments.RecordBusinessEvent(ctx, eventType, outcome)
	}
}

// HTTP middleware to automatically measure requests
func HTTPMetricsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if globalInstruments == nil {
			next.ServeHTTP(w, r)
			return
		}

		// Create a response writer wrapper to capture status code
		wrapper := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		
		// Start metrics measurement
		metrics := NewRequestMetrics(r.Context(), r.Method, r.URL.Path)
		
		// Call the next handler
		next.ServeHTTP(wrapper, r)
		
		// End metrics measurement
		metrics.End(wrapper.statusCode)
	})
}

// responseWriter wraps http.ResponseWriter to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// Business-specific metric helpers

// RecordAuthEvent records authentication-related events
func RecordAuthEvent(ctx context.Context, eventType string, success bool) {
	outcome := "success"
	if !success {
		outcome = "failure"
	}
	RecordBusinessEvent(ctx, "auth_"+eventType, outcome)
}

// RecordTransactionEvent records transaction-related events
func RecordTransactionEvent(ctx context.Context, eventType string, success bool) {
	outcome := "success"
	if !success {
		outcome = "failure"
	}
	RecordBusinessEvent(ctx, "transaction_"+eventType, outcome)
}

// RecordUserEvent records user-related events
func RecordUserEvent(ctx context.Context, eventType string, success bool) {
	outcome := "success"
	if !success {
		outcome = "failure"
	}
	RecordBusinessEvent(ctx, "user_"+eventType, outcome)
}