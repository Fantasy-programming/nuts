package server_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Fantasy-Programming/nuts/server/pkg/logging"
	"github.com/Fantasy-Programming/nuts/server/pkg/telemetry"
	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
)

func TestHTTPWithTelemetry(t *testing.T) {
	// Setup telemetry
	logger := logging.NewLogger()
	cfg := telemetry.Config{
		ServiceName:    "test-nuts-backend",
		ServiceVersion: "v1.0.0-test",
		Environment:    "test",
		OTLPEndpoint:   "", // No endpoint for test
		Enabled:        true,
	}

	ctx := context.Background()
	shutdown, err := telemetry.Setup(ctx, cfg, logger)
	require.NoError(t, err)
	defer shutdown(ctx)

	// Create a chi router with telemetry middleware similar to server setup
	r := chi.NewRouter()
	
	// Add middleware
	r.Use(chiMiddleware.RequestID)
	r.Use(chiMiddleware.RealIP)
	r.Use(chiMiddleware.Recoverer)
	
	// Add OpenTelemetry HTTP instrumentation
	r.Use(func(next http.Handler) http.Handler {
		return otelhttp.NewHandler(next, "test-nuts-backend",
			otelhttp.WithTracerProvider(otel.GetTracerProvider()),
		)
	})

	// Add request logger with tracing
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			contextLogger := logging.LoggerWithTraceCtx(ctx, logger)
			
			requestID := chiMiddleware.GetReqID(ctx)
			if requestID != "" {
				contextLogger = logging.ContextMiddleware(contextLogger, requestID, "")
			}

			contextLogger.Info().
				Str("method", r.Method).
				Str("url", r.URL.String()).
				Msg("Test request")

			next.ServeHTTP(w, r)
		})
	})

	// Add a test endpoint
	r.Get("/test", func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		
		// Start a custom span to demonstrate tracing
		tracer := otel.Tracer("test-handler")
		_, span := tracer.Start(ctx, "test-operation")
		defer span.End()
		
		contextLogger := logging.LoggerWithTraceCtx(ctx, logger)
		contextLogger.Info().Msg("Processing test request")
		
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("test response"))
	})

	// Test the endpoint
	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "test response", w.Body.String())

	// Verify that traces were created (basic check)
	// In a real scenario, you would inspect exported traces
	tp := otel.GetTracerProvider()
	assert.NotNil(t, tp)
}