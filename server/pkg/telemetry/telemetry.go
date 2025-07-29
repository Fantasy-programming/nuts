package telemetry

import (
	"context"
	"time"

	"github.com/Fantasy-Programming/nuts/server/config"
	"github.com/rs/zerolog"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/propagation"
	metricSDK "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/metric/metricdata"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
)

// Setup initializes OpenTelemetry tracing and metrics
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

	// Setup tracing
	var traceShutdown func(context.Context) error
	traceShutdown, err = setupTracing(ctx, cfg, res, logger)
	if err != nil {
		return nil, err
	}

	// Setup metrics
	var metricsShutdown func(context.Context) error
	metricsShutdown, err = setupMetrics(ctx, cfg, res, logger)
	if err != nil {
		// If metrics setup fails, we still want tracing to work
		logger.Error().Err(err).Msg("Failed to setup metrics, continuing with tracing only")
		metricsShutdown = func(ctx context.Context) error { return nil }
	}

	// Set global propagator
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	logger.Info().
		Str("service", cfg.OtlpServiceName).
		Str("version", cfg.OtlpServiceVersion).
		Str("environment", cfg.OtlpEnvironment).
		Msg("OpenTelemetry tracing and metrics initialized")

	// Return combined shutdown function
	return func(ctx context.Context) error {
		var errs []error
		if err := traceShutdown(ctx); err != nil {
			errs = append(errs, err)
		}
		if err := metricsShutdown(ctx); err != nil {
			errs = append(errs, err)
		}
		if len(errs) > 0 {
			return errs[0] // Return first error
		}
		return nil
	}, nil
}

// setupTracing initializes OpenTelemetry tracing
func setupTracing(ctx context.Context, cfg config.Otel, res *resource.Resource, logger *zerolog.Logger) (func(context.Context) error, error) {
	// Create OTLP trace exporter
	var exporter trace.SpanExporter
	var err error
	if cfg.OtlpEndpoint != "" {
		exporter, err = otlptracehttp.New(ctx,
			otlptracehttp.WithEndpoint(cfg.OtlpEndpoint),
			otlptracehttp.WithTimeout(time.Second*10),
		)
		if err != nil {
			return nil, err
		}
		logger.Info().Str("endpoint", cfg.OtlpEndpoint).Msg("Using OTLP HTTP trace exporter")
	} else {
		// If no endpoint is provided, use a no-op exporter but still create spans for logging
		exporter = &noopTraceExporter{}
		logger.Info().Msg("Using no-op trace exporter (OTLP endpoint not configured)")
	}

	// Create trace provider
	tp := trace.NewTracerProvider(
		trace.WithBatcher(exporter),
		trace.WithResource(res),
		trace.WithSampler(trace.AlwaysSample()),
	)

	// Set global tracer provider
	otel.SetTracerProvider(tp)

	return tp.Shutdown, nil
}

// setupMetrics initializes OpenTelemetry metrics
func setupMetrics(ctx context.Context, cfg config.Otel, res *resource.Resource, logger *zerolog.Logger) (func(context.Context) error, error) {
	// Create OTLP metrics exporter
	var exporter metricSDK.Exporter
	var err error
	if cfg.OtlpEndpoint != "" {
		exporter, err = otlpmetrichttp.New(ctx,
			otlpmetrichttp.WithEndpoint(cfg.OtlpEndpoint),
			otlpmetrichttp.WithTimeout(time.Second*10),
		)
		if err != nil {
			return nil, err
		}
		logger.Info().Str("endpoint", cfg.OtlpEndpoint).Msg("Using OTLP HTTP metrics exporter")
	} else {
		// If no endpoint is provided, use a no-op exporter
		exporter = &noopMetricsExporter{}
		logger.Info().Msg("Using no-op metrics exporter (OTLP endpoint not configured)")
	}

	// Create metrics provider
	mp := metricSDK.NewMeterProvider(
		metricSDK.WithResource(res),
		metricSDK.WithReader(metricSDK.NewPeriodicReader(exporter,
			metricSDK.WithInterval(30*time.Second),
		)),
	)

	// Set global meter provider
	otel.SetMeterProvider(mp)

	return mp.Shutdown, nil
}

// noopTraceExporter is a simple no-op exporter for when OTLP endpoint is not configured
type noopTraceExporter struct{}

func (e *noopTraceExporter) ExportSpans(ctx context.Context, spans []trace.ReadOnlySpan) error {
	return nil
}

func (e *noopTraceExporter) Shutdown(ctx context.Context) error {
	return nil
}

// noopMetricsExporter is a simple no-op exporter for when OTLP endpoint is not configured
type noopMetricsExporter struct{}

func (e *noopMetricsExporter) Temporality(kind metricSDK.InstrumentKind) metricdata.Temporality {
	return metricdata.CumulativeTemporality
}

func (e *noopMetricsExporter) Aggregation(kind metricSDK.InstrumentKind) metricSDK.Aggregation {
	return metricSDK.DefaultAggregationSelector(kind)
}

func (e *noopMetricsExporter) Export(ctx context.Context, rm *metricdata.ResourceMetrics) error {
	return nil
}

func (e *noopMetricsExporter) ForceFlush(ctx context.Context) error {
	return nil
}

func (e *noopMetricsExporter) Shutdown(ctx context.Context) error {
	return nil
}

// Metrics helper functions and structs

// Instruments holds commonly used metrics instruments
type Instruments struct {
	RequestCounter        metric.Int64Counter
	RequestDuration       metric.Float64Histogram
	ErrorCounter          metric.Int64Counter
	BusinessMetricCounter metric.Int64Counter
}

// NewInstruments creates and returns common metrics instruments
func NewInstruments(meter metric.Meter) (*Instruments, error) {
	requestCounter, err := meter.Int64Counter(
		"http_requests_total",
		metric.WithDescription("Total number of HTTP requests"),
	)
	if err != nil {
		return nil, err
	}

	requestDuration, err := meter.Float64Histogram(
		"http_request_duration_seconds",
		metric.WithDescription("Duration of HTTP requests in seconds"),
		metric.WithUnit("s"),
	)
	if err != nil {
		return nil, err
	}

	errorCounter, err := meter.Int64Counter(
		"errors_total",
		metric.WithDescription("Total number of errors"),
	)
	if err != nil {
		return nil, err
	}

	businessMetricCounter, err := meter.Int64Counter(
		"business_events_total",
		metric.WithDescription("Total number of business events"),
	)
	if err != nil {
		return nil, err
	}

	return &Instruments{
		RequestCounter:        requestCounter,
		RequestDuration:       requestDuration,
		ErrorCounter:          errorCounter,
		BusinessMetricCounter: businessMetricCounter,
	}, nil
}

// RecordHTTPRequest records metrics for an HTTP request
func (i *Instruments) RecordHTTPRequest(ctx context.Context, method, handler, status string, duration float64) {
	if i == nil {
		return
	}
	
	attrs := metric.WithAttributes(
		attribute.String("method", method),
		attribute.String("handler", handler),
		attribute.String("status", status),
	)
	
	i.RequestCounter.Add(ctx, 1, attrs)
	i.RequestDuration.Record(ctx, duration, attrs)
}

// RecordError records an error metric
func (i *Instruments) RecordError(ctx context.Context, errorType, handler string) {
	if i == nil {
		return
	}
	
	i.ErrorCounter.Add(ctx, 1, metric.WithAttributes(
		attribute.String("error_type", errorType),
		attribute.String("handler", handler),
	))
}

// RecordBusinessEvent records a business-specific metric
func (i *Instruments) RecordBusinessEvent(ctx context.Context, eventType, outcome string) {
	if i == nil {
		return
	}
	
	i.BusinessMetricCounter.Add(ctx, 1, metric.WithAttributes(
		attribute.String("event_type", eventType),
		attribute.String("outcome", outcome),
	))
}

// GetMeter returns a meter instance for the nuts service
func GetMeter() metric.Meter {
	return otel.Meter("nuts-backend")
}

