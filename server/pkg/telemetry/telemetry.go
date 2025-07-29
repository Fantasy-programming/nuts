package telemetry

import (
	"context"
	"fmt"
	"strconv"
	"strings"
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

	// Create resource with additional attributes if provided
	resourceAttrs := []attribute.KeyValue{
		semconv.ServiceName(cfg.OtlpServiceName),
		semconv.ServiceVersion(cfg.OtlpServiceVersion),
		semconv.DeploymentEnvironment(cfg.OtlpEnvironment),
	}
	
	// Parse additional resource attributes if provided
	if cfg.ResourceAttributes != "" {
		additionalAttrs, err := parseResourceAttributes(cfg.ResourceAttributes)
		if err != nil {
			logger.Warn().Err(err).Msg("Failed to parse resource attributes, continuing with defaults")
		} else {
			resourceAttrs = append(resourceAttrs, additionalAttrs...)
		}
	}

	res, err := resource.New(ctx, resource.WithAttributes(resourceAttrs...))
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
	
	endpoint := cfg.OtlpEndpoint
	if cfg.ExporterOtlpEndpoint != "" {
		endpoint = cfg.ExporterOtlpEndpoint
	}
	
	if endpoint != "" {
		// Prepare exporter options
		opts := []otlptracehttp.Option{
			otlptracehttp.WithEndpoint(endpoint),
			otlptracehttp.WithTimeout(time.Second * 10),
		}
		
		// Add headers if provided
		if cfg.ExporterOtlpHeaders != "" {
			headers, err := parseHeaders(cfg.ExporterOtlpHeaders)
			if err != nil {
				logger.Warn().Err(err).Msg("Failed to parse OTLP headers, continuing without custom headers")
			} else {
				opts = append(opts, otlptracehttp.WithHeaders(headers))
			}
		}
		
		// Add compression if specified
		if cfg.ExporterOtlpCompression != "" {
			compression := parseCompression(cfg.ExporterOtlpCompression)
			opts = append(opts, otlptracehttp.WithCompression(compression))
		}
		
		exporter, err = otlptracehttp.New(ctx, opts...)
		if err != nil {
			return nil, err
		}
		logger.Info().
			Str("endpoint", endpoint).
			Str("compression", cfg.ExporterOtlpCompression).
			Str("protocol", cfg.ExporterOtlpProtocol).
			Msg("Using OTLP HTTP trace exporter")
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
	
	endpoint := cfg.OtlpEndpoint
	if cfg.ExporterOtlpEndpoint != "" {
		endpoint = cfg.ExporterOtlpEndpoint
	}
	
	if endpoint != "" {
		// Prepare exporter options
		opts := []otlpmetrichttp.Option{
			otlpmetrichttp.WithEndpoint(endpoint),
			otlpmetrichttp.WithTimeout(time.Second * 10),
		}
		
		// Add headers if provided
		if cfg.ExporterOtlpHeaders != "" {
			headers, err := parseHeaders(cfg.ExporterOtlpHeaders)
			if err != nil {
				logger.Warn().Err(err).Msg("Failed to parse OTLP headers for metrics, continuing without custom headers")
			} else {
				opts = append(opts, otlpmetrichttp.WithHeaders(headers))
			}
		}
		
		// Add compression if specified
		if cfg.ExporterOtlpCompression != "" {
			compression := parseMetricsCompression(cfg.ExporterOtlpCompression)
			opts = append(opts, otlpmetrichttp.WithCompression(compression))
		}
		
		exporter, err = otlpmetrichttp.New(ctx, opts...)
		if err != nil {
			return nil, err
		}
		logger.Info().
			Str("endpoint", endpoint).
			Str("compression", cfg.ExporterOtlpCompression).
			Str("temporality_preference", cfg.ExporterOtlpMetricsTemporalityPreference).
			Msg("Using OTLP HTTP metrics exporter")
	} else {
		// If no endpoint is provided, use a no-op exporter
		exporter = &noopMetricsExporter{}
		logger.Info().Msg("Using no-op metrics exporter (OTLP endpoint not configured)")
	}

	// Parse temporality preference
	temporality := parseTemporality(cfg.ExporterOtlpMetricsTemporalityPreference)

	// Create metrics provider with custom temporality
	mp := metricSDK.NewMeterProvider(
		metricSDK.WithResource(res),
		metricSDK.WithReader(metricSDK.NewPeriodicReader(
			&temporalityExporter{
				exporter:    exporter,
				temporality: temporality,
			},
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

// temporalityExporter wraps an exporter to apply custom temporality preferences
type temporalityExporter struct {
	exporter    metricSDK.Exporter
	temporality metricdata.Temporality
}

func (e *temporalityExporter) Temporality(kind metricSDK.InstrumentKind) metricdata.Temporality {
	return e.temporality
}

func (e *temporalityExporter) Aggregation(kind metricSDK.InstrumentKind) metricSDK.Aggregation {
	return e.exporter.Aggregation(kind)
}

func (e *temporalityExporter) Export(ctx context.Context, rm *metricdata.ResourceMetrics) error {
	return e.exporter.Export(ctx, rm)
}

func (e *temporalityExporter) ForceFlush(ctx context.Context) error {
	return e.exporter.ForceFlush(ctx)
}

func (e *temporalityExporter) Shutdown(ctx context.Context) error {
	return e.exporter.Shutdown(ctx)
}

// parseHeaders parses header string in the format "key1=value1,key2=value2"
func parseHeaders(headerStr string) (map[string]string, error) {
	headers := make(map[string]string)
	if headerStr == "" {
		return headers, nil
	}
	
	pairs := strings.Split(headerStr, ",")
	for _, pair := range pairs {
		if strings.TrimSpace(pair) == "" {
			continue
		}
		
		kv := strings.SplitN(strings.TrimSpace(pair), "=", 2)
		if len(kv) != 2 {
			return nil, fmt.Errorf("invalid header format: %s", pair)
		}
		
		key := strings.TrimSpace(kv[0])
		value := strings.TrimSpace(kv[1])
		headers[key] = value
	}
	
	return headers, nil
}

// parseCompression converts compression string to trace compression type
func parseCompression(compressionStr string) otlptracehttp.Compression {
	switch strings.ToLower(compressionStr) {
	case "gzip":
		return otlptracehttp.GzipCompression
	case "none", "":
		return otlptracehttp.NoCompression
	default:
		return otlptracehttp.NoCompression
	}
}

// parseMetricsCompression converts compression string to metrics compression type
func parseMetricsCompression(compressionStr string) otlpmetrichttp.Compression {
	switch strings.ToLower(compressionStr) {
	case "gzip":
		return otlpmetrichttp.GzipCompression
	case "none", "":
		return otlpmetrichttp.NoCompression
	default:
		return otlpmetrichttp.NoCompression
	}
}

// parseTemporality converts temporality string to Temporality type
func parseTemporality(temporalityStr string) metricdata.Temporality {
	switch strings.ToLower(temporalityStr) {
	case "delta":
		return metricdata.DeltaTemporality
	case "cumulative":
		return metricdata.CumulativeTemporality
	default:
		return metricdata.DeltaTemporality // Default to delta as specified in config
	}
}

// parseResourceAttributes parses resource attributes string in the format "key1=value1,key2=value2"
func parseResourceAttributes(attrStr string) ([]attribute.KeyValue, error) {
	var attrs []attribute.KeyValue
	if attrStr == "" {
		return attrs, nil
	}
	
	pairs := strings.Split(attrStr, ",")
	for _, pair := range pairs {
		if strings.TrimSpace(pair) == "" {
			continue
		}
		
		kv := strings.SplitN(strings.TrimSpace(pair), "=", 2)
		if len(kv) != 2 {
			return nil, fmt.Errorf("invalid resource attribute format: %s", pair)
		}
		
		key := strings.TrimSpace(kv[0])
		value := strings.TrimSpace(kv[1])
		
		// Try to parse as number first, then string
		if intVal, err := strconv.Atoi(value); err == nil {
			attrs = append(attrs, attribute.Int(key, intVal))
		} else if floatVal, err := strconv.ParseFloat(value, 64); err == nil {
			attrs = append(attrs, attribute.Float64(key, floatVal))
		} else if boolVal, err := strconv.ParseBool(value); err == nil {
			attrs = append(attrs, attribute.Bool(key, boolVal))
		} else {
			attrs = append(attrs, attribute.String(key, value))
		}
	}
	
	return attrs, nil
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

