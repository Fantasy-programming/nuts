package database

import (
	"context"

	"github.com/Fantasy-Programming/nuts/server/pkg/logging"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
)

// TracingQueryTracer implements pgx.QueryTracer to add OpenTelemetry tracing
type TracingQueryTracer struct {
	logger *zerolog.Logger
	tracer trace.Tracer
}

// NewTracingQueryTracer creates a new tracing query tracer
func NewTracingQueryTracer(logger *zerolog.Logger) *TracingQueryTracer {
	return &TracingQueryTracer{
		logger: logger,
		tracer: otel.Tracer("nuts-backend-db"),
	}
}

// TraceQueryStart is called at the beginning of Query, QueryRow, and Exec calls
func (t *TracingQueryTracer) TraceQueryStart(ctx context.Context, conn *pgx.Conn, data pgx.TraceQueryStartData) context.Context {
	ctx, _ = t.tracer.Start(ctx, "db.query",
		trace.WithAttributes(
			attribute.String("db.system", "postgresql"),
			attribute.String("db.statement", data.SQL),
		),
	)

	// Enhanced logging with trace context
	logger := logging.LoggerWithTraceCtx(ctx, t.logger)
	logger.Debug().
		Str("sql", data.SQL).
		Interface("args", data.Args).
		Msg("Database query started")

	return ctx
}

// TraceQueryEnd is called at the end of Query, QueryRow, and Exec calls
func (t *TracingQueryTracer) TraceQueryEnd(ctx context.Context, conn *pgx.Conn, data pgx.TraceQueryEndData) {
	span := trace.SpanFromContext(ctx)
	defer span.End()

	logger := logging.LoggerWithTraceCtx(ctx, t.logger)

	if data.Err != nil {
		span.RecordError(data.Err)
		span.SetStatus(codes.Error, data.Err.Error())
		logger.Error().
			Err(data.Err).
			Str("command_tag", data.CommandTag.String()).
			Msg("Database query failed")
	} else {
		span.SetAttributes(
			attribute.String("db.command_tag", data.CommandTag.String()),
			attribute.Int64("db.rows_affected", data.CommandTag.RowsAffected()),
		)
		logger.Debug().
			Str("command_tag", data.CommandTag.String()).
			Int64("rows_affected", data.CommandTag.RowsAffected()).
			Msg("Database query completed")
	}
}

// ConfigurePoolWithTracing configures a pgxpool with tracing
func ConfigurePoolWithTracing(config *pgxpool.Config, logger *zerolog.Logger) {
	tracer := NewTracingQueryTracer(logger)
	config.ConnConfig.Tracer = tracer
	
	// Add connection lifecycle logging
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