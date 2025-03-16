package logger

import (
	"github.com/rs/zerolog"
)

// ZerologAdapter adapts zerolog to implement the Logger interface
type ZerologAdapter struct {
	logger *zerolog.Logger
}

// NewZerologAdapter creates a new zerolog adapter
func NewZerologAdapter(logger *zerolog.Logger) *ZerologAdapter {
	return &ZerologAdapter{
		logger: logger,
	}
}

// Error logs an error message
func (l *ZerologAdapter) Error(msg string, err error) {
	l.logger.Error().Err(err).Msg(msg)
}

// Info logs an informational message
func (l *ZerologAdapter) Info(msg string, args ...interface{}) {
	l.logger.Info().Interface("args", args).Msg(msg)
}
