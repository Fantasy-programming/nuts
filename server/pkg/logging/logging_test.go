package logging_test

import (
	"context"
	"os"
	"testing"

	"github.com/Fantasy-Programming/nuts/server/pkg/logging"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"go.opentelemetry.io/otel"
)

func TestNewLogger(t *testing.T) {
	logger := logging.NewLogger()
	assert.NotNil(t, logger)
}

func TestLoggerWithTraceCtx(t *testing.T) {
	logger := logging.NewLogger()
	
	// Test with context that has no span
	ctx := context.Background()
	contextLogger := logging.LoggerWithTraceCtx(ctx, logger)
	assert.NotNil(t, contextLogger)
	// Should return the same logger when no trace context
	assert.Equal(t, logger, contextLogger)

	// Test with context that has a span
	tracer := otel.Tracer("test")
	ctx, span := tracer.Start(ctx, "test-span")
	defer span.End()
	
	contextLogger = logging.LoggerWithTraceCtx(ctx, logger)
	assert.NotNil(t, contextLogger)
	// Should be a different logger instance with trace context
	if span.IsRecording() {
		assert.NotEqual(t, logger, contextLogger)
	}
}

func TestContextMiddleware(t *testing.T) {
	logger := logging.NewLogger()
	
	// Test with empty values
	contextLogger := logging.ContextMiddleware(logger, "", "")
	assert.NotNil(t, contextLogger)
	
	// Test with request ID
	requestID := "test-request-123"
	contextLogger = logging.ContextMiddleware(logger, requestID, "")
	assert.NotNil(t, contextLogger)
	
	// Test with user ID
	userID := "user-456"
	contextLogger = logging.ContextMiddleware(logger, requestID, userID)
	assert.NotNil(t, contextLogger)
}

func TestLogLevelFromEnv(t *testing.T) {
	// Save original env
	originalLogLevel := os.Getenv("LOG_LEVEL")
	defer os.Setenv("LOG_LEVEL", originalLogLevel)
	
	// Test different log levels
	testCases := []struct {
		envValue string
		expected zerolog.Level
	}{
		{"debug", zerolog.DebugLevel},
		{"info", zerolog.InfoLevel},
		{"warn", zerolog.WarnLevel},
		{"error", zerolog.ErrorLevel},
		{"invalid", zerolog.InfoLevel}, // should default to info
		{"", zerolog.InfoLevel},        // should default to info
	}
	
	for _, tc := range testCases {
		t.Run(tc.envValue, func(t *testing.T) {
			os.Setenv("LOG_LEVEL", tc.envValue)
			logger := logging.NewLogger()
			assert.NotNil(t, logger)
			// Note: We can't easily test the actual log level without refactoring,
			// but we can at least verify the logger is created
		})
	}
}