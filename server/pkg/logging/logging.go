package logging

import (
	"context"
	"os"

	"github.com/rs/zerolog"
	"go.opentelemetry.io/otel/trace"
)

// LoggerWithTraceCtx creates a logger with trace context information
func LoggerWithTraceCtx(ctx context.Context, logger *zerolog.Logger) *zerolog.Logger {
	span := trace.SpanFromContext(ctx)
	if !span.IsRecording() {
		return logger
	}

	spanCtx := span.SpanContext()

	contextLogger := logger.With().
		Str("trace_id", spanCtx.TraceID().String()).
		Str("span_id", spanCtx.SpanID().String()).
		Logger()

	return &contextLogger
}

// NewLogger creates an enhanced logger with better configuration
func NewLogger(logLevelStr string) *zerolog.Logger {
	logLevel := getLogLevel(logLevelStr)

	env := os.Getenv("ENVIRONMENT")

	if env == "test" {
		logLevel = zerolog.Disabled
	}

	zerolog.SetGlobalLevel(logLevel)

	logger := zerolog.New(os.Stdout).With().
		Timestamp().
		Caller().
		Logger()

	// Use console writer for non-production environments
	if env != "production" {
		logger = logger.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	}

	return &logger
}

// getLogLevel returns the appropriate log level based on environment
func getLogLevel(loglevelStr string) zerolog.Level {
	switch loglevelStr {
	case "trace":
		return zerolog.TraceLevel
	case "debug":
		return zerolog.DebugLevel
	case "info":
		return zerolog.InfoLevel
	case "warn":
		return zerolog.WarnLevel
	case "error":
		return zerolog.ErrorLevel
	case "fatal":
		return zerolog.FatalLevel
	case "panic":
		return zerolog.PanicLevel
	default:
		return zerolog.InfoLevel
	}
}

// ContextMiddleware adds common context information to logs
func ContextMiddleware(logger *zerolog.Logger, requestID, userID string) *zerolog.Logger {
	contextLogger := logger.With()

	if requestID != "" {
		contextLogger = contextLogger.Str("request_id", requestID)
	}

	if userID != "" {
		contextLogger = contextLogger.Str("user_id", userID)
	}

	result := contextLogger.Logger()
	return &result
}

