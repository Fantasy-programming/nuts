package database

import (
	"context"

	"github.com/Fantasy-Programming/nuts/server/pkg/logging"
	"github.com/exaring/otelpgx"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

// ConfigurePoolWithTracing configures a pgxpool with OpenTelemetry tracing if enabled
func ConfigurePoolWithTracing(config *pgxpool.Config, logger *zerolog.Logger, tracingEnabled bool) {
	if tracingEnabled {
		// Use otelpgx for OpenTelemetry instrumentation
		config.ConnConfig.Tracer = otelpgx.NewTracer(
			otelpgx.WithTracerProvider(nil), // Use global tracer provider
		)
		logger.Debug().Msg("Database tracing enabled with otelpgx")
	} else {
		logger.Debug().Msg("Database tracing disabled")
	}
	
	// Add connection lifecycle logging (always enabled for observability)
	config.BeforeAcquire = func(ctx context.Context, conn *pgx.Conn) bool {
		logger := logging.LoggerWithTraceCtx(ctx, logger)
		logger.Trace().Msg("Database connection acquired from pool")
		return true
	}
	
	config.AfterRelease = func(conn *pgx.Conn) bool {
		logger.Trace().Msg("Database connection released to pool")
		return true
	}
}