package log

import (
	"os"
	"time"

	"github.com/rs/zerolog"
)

var (
	// EnableStackTraces controls whether stack traces are automatically added to error logs
	EnableStackTraces = true
)

// Configure sets up zerolog with common settings
func Configure(serviceName string, debug bool) zerolog.Logger {
	// Set appropriate log level based on debug flag
	zerolog.SetGlobalLevel(zerolog.InfoLevel)
	if debug {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	}

	// Create a logger with common fields
	logger := zerolog.New(os.Stdout).
		With().
		Timestamp().
		Str("service", serviceName).
		Logger()

	return logger
}

// Error returns an error event with stack trace when enabled
func Error(logger zerolog.Logger) *zerolog.Event {
	errEvent := logger.Error()
	if EnableStackTraces {
		errEvent = WithStackTrace(errEvent)
	}
	return errEvent
}

// TraceError logs an error with stack trace and returns the error
// Useful for one-liners to log and return an error
func TraceError(logger zerolog.Logger, err error, msg string) error {
	if err != nil {
		WithStackTrace(logger.Error()).
			Err(err).
			Time("timestamp", time.Now()).
			Msg(msg)
	}
	return err
}
