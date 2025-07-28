package telemetry

import (
	"context"
	"os"
	"time"

	"github.com/rs/zerolog"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
)

// Config holds the telemetry configuration
type Config struct {
	ServiceName    string
	ServiceVersion string
	Environment    string
	OTLPEndpoint   string
	Enabled        bool
}

// Setup initializes OpenTelemetry tracing
func Setup(ctx context.Context, cfg Config, logger *zerolog.Logger) (func(context.Context) error, error) {
	if !cfg.Enabled {
		logger.Info().Msg("OpenTelemetry disabled")
		return func(ctx context.Context) error { return nil }, nil
	}

	// Create resource
	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName(cfg.ServiceName),
			semconv.ServiceVersion(cfg.ServiceVersion),
			semconv.DeploymentEnvironment(cfg.Environment),
		),
	)
	if err != nil {
		return nil, err
	}

	// Create OTLP trace exporter
	var exporter trace.SpanExporter
	if cfg.OTLPEndpoint != "" {
		exporter, err = otlptracehttp.New(ctx,
			otlptracehttp.WithEndpoint(cfg.OTLPEndpoint),
			otlptracehttp.WithTimeout(time.Second*10),
		)
		if err != nil {
			return nil, err
		}
		logger.Info().Str("endpoint", cfg.OTLPEndpoint).Msg("Using OTLP HTTP exporter")
	} else {
		// If no endpoint is provided, use a no-op exporter but still create spans for logging
		exporter = &noopExporter{}
		logger.Info().Msg("Using no-op exporter for tracing (OTLP endpoint not configured)")
	}

	// Create trace provider
	tp := trace.NewTracerProvider(
		trace.WithBatcher(exporter),
		trace.WithResource(res),
		trace.WithSampler(trace.AlwaysSample()),
	)

	// Set global tracer provider
	otel.SetTracerProvider(tp)

	// Set global propagator
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	logger.Info().
		Str("service", cfg.ServiceName).
		Str("version", cfg.ServiceVersion).
		Str("environment", cfg.Environment).
		Msg("OpenTelemetry tracing initialized")

	return tp.Shutdown, nil
}

// DefaultConfig returns a default telemetry configuration
func DefaultConfig() Config {
	return Config{
		ServiceName:    getEnvOrDefault("OTEL_SERVICE_NAME", "nuts-backend"),
		ServiceVersion: getEnvOrDefault("OTEL_SERVICE_VERSION", "unknown"),
		Environment:    getEnvOrDefault("ENVIRONMENT", "development"),
		OTLPEndpoint:   os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT"),
		Enabled:        getEnvOrDefault("OTEL_ENABLED", "true") == "true",
	}
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// noopExporter is a simple no-op exporter for when OTLP endpoint is not configured
type noopExporter struct{}

func (e *noopExporter) ExportSpans(ctx context.Context, spans []trace.ReadOnlySpan) error {
	return nil
}

func (e *noopExporter) Shutdown(ctx context.Context) error {
	return nil
}