package telemetry

import (
	"context"
	"time"

	"github.com/Fantasy-Programming/nuts/server/config"
	"github.com/rs/zerolog"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
)

// Setup initializes OpenTelemetry tracing
func Setup(ctx context.Context, cfg config.Otel, logger *zerolog.Logger) (func(context.Context) error, error) {
	if !cfg.Enabled {
		logger.Info().Msg("OpenTelemetry disabled")
		return func(ctx context.Context) error { return nil }, nil
	}

	// Create resource
	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName(cfg.OtlpServiceName),
			semconv.ServiceVersion(cfg.OtlpServiceVersion),
			semconv.DeploymentEnvironment(cfg.OtlpEnvironment),
		),
	)
	if err != nil {
		return nil, err
	}

	// Create OTLP trace exporter
	var exporter trace.SpanExporter
	if cfg.OtlpEndpoint != "" {
		exporter, err = otlptracehttp.New(ctx,
			otlptracehttp.WithEndpoint(cfg.OtlpEndpoint),
			otlptracehttp.WithTimeout(time.Second*10),
		)
		if err != nil {
			return nil, err
		}
		logger.Info().Str("endpoint", cfg.OtlpEndpoint).Msg("Using OTLP HTTP exporter")
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
		Str("service", cfg.OtlpServiceName).
		Str("version", cfg.OtlpServiceVersion).
		Str("environment", cfg.OtlpEnvironment).
		Msg("OpenTelemetry tracing initialized")

	return tp.Shutdown, nil
}

// noopExporter is a simple no-op exporter for when OTLP endpoint is not configured
type noopExporter struct{}

func (e *noopExporter) ExportSpans(ctx context.Context, spans []trace.ReadOnlySpan) error {
	return nil
}

func (e *noopExporter) Shutdown(ctx context.Context) error {
	return nil
}

