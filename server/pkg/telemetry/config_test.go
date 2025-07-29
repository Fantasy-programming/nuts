package telemetry

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/sdk/metric/metricdata"
)

func TestParseHeaders(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected map[string]string
		hasError bool
	}{
		{
			name:     "valid headers",
			input:    "api-key=abc123,content-type=application/json",
			expected: map[string]string{"api-key": "abc123", "content-type": "application/json"},
			hasError: false,
		},
		{
			name:     "single header",
			input:    "authorization=Bearer token123",
			expected: map[string]string{"authorization": "Bearer token123"},
			hasError: false,
		},
		{
			name:     "empty string",
			input:    "",
			expected: map[string]string{},
			hasError: false,
		},
		{
			name:     "invalid format",
			input:    "invalid-header-format",
			expected: nil,
			hasError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := parseHeaders(tt.input)
			if tt.hasError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expected, result)
			}
		})
	}
}

func TestParseCompression(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected otlptracehttp.Compression
	}{
		{"gzip", "gzip", otlptracehttp.GzipCompression},
		{"none", "none", otlptracehttp.NoCompression},
		{"empty", "", otlptracehttp.NoCompression},
		{"invalid", "invalid", otlptracehttp.NoCompression},
		{"case insensitive", "GZIP", otlptracehttp.GzipCompression},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parseCompression(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestParseMetricsCompression(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected otlpmetrichttp.Compression
	}{
		{"gzip", "gzip", otlpmetrichttp.GzipCompression},
		{"none", "none", otlpmetrichttp.NoCompression},
		{"empty", "", otlpmetrichttp.NoCompression},
		{"invalid", "invalid", otlpmetrichttp.NoCompression},
		{"case insensitive", "GZIP", otlpmetrichttp.GzipCompression},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parseMetricsCompression(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestParseTemporality(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected metricdata.Temporality
	}{
		{"delta", "delta", metricdata.DeltaTemporality},
		{"cumulative", "cumulative", metricdata.CumulativeTemporality},
		{"empty defaults to delta", "", metricdata.DeltaTemporality},
		{"invalid defaults to delta", "invalid", metricdata.DeltaTemporality},
		{"case insensitive", "DELTA", metricdata.DeltaTemporality},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parseTemporality(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestParseResourceAttributes(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected []attribute.KeyValue
		hasError bool
	}{
		{
			name:  "mixed types",
			input: "env=production,port=8080,debug=true,version=1.2.3",
			expected: []attribute.KeyValue{
				attribute.String("env", "production"),
				attribute.Int("port", 8080),
				attribute.Bool("debug", true),
				attribute.String("version", "1.2.3"),
			},
			hasError: false,
		},
		{
			name:     "empty string",
			input:    "",
			expected: nil,
			hasError: false,
		},
		{
			name:     "invalid format",
			input:    "invalid-format",
			expected: nil,
			hasError: true,
		},
		{
			name:  "float value",
			input: "cpu_usage=75.5",
			expected: []attribute.KeyValue{
				attribute.Float64("cpu_usage", 75.5),
			},
			hasError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := parseResourceAttributes(tt.input)
			if tt.hasError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expected, result)
			}
		})
	}
}