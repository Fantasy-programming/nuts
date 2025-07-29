package telemetry

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestInstrumentsInitialization(t *testing.T) {
	// Test that metrics instruments can be initialized without error
	err := InitializeMetrics()
	assert.NoError(t, err, "InitializeMetrics should not return an error")
}

func TestRequestMetrics(t *testing.T) {
	// Test that RequestMetrics can be created and ended without panic
	ctx := context.Background()
	
	// This should not panic even if global instruments are not initialized
	metrics := NewRequestMetrics(ctx, "GET", "test.handler")
	assert.NotNil(t, metrics, "NewRequestMetrics should return non-nil metrics")
	
	// This should not panic
	metrics.End(200)
}

func TestRecordError(t *testing.T) {
	// Test that RecordError can be called without panic
	ctx := context.Background()
	
	// This should not panic even if global instruments are not initialized
	RecordError(ctx, "test_error", "test.handler")
}

func TestRecordBusinessEvent(t *testing.T) {
	// Test that RecordBusinessEvent can be called without panic
	ctx := context.Background()
	
	// This should not panic even if global instruments are not initialized
	RecordBusinessEvent(ctx, "test_event", "success")
}

func TestAuthEventHelpers(t *testing.T) {
	// Test auth event helper functions
	ctx := context.Background()
	
	// These should not panic
	RecordAuthEvent(ctx, "login", true)
	RecordAuthEvent(ctx, "login", false)
	RecordTransactionEvent(ctx, "create", true)
	RecordTransactionEvent(ctx, "create", false)
	RecordUserEvent(ctx, "update", true)
	RecordUserEvent(ctx, "update", false)
}

func TestMetricsWithInstruments(t *testing.T) {
	// Test with actual instruments initialized
	err := InitializeMetrics()
	require.NoError(t, err, "InitializeMetrics should not return an error")
	
	ctx := context.Background()
	
	// Test request metrics
	metrics := NewRequestMetrics(ctx, "POST", "auth.Login")
	assert.NotNil(t, metrics, "NewRequestMetrics should return non-nil metrics")
	metrics.End(200)
	
	// Test error recording
	RecordError(ctx, "validation_error", "auth.Login")
	
	// Test business event recording
	RecordBusinessEvent(ctx, "login", "success")
	RecordAuthEvent(ctx, "login", true)
	RecordTransactionEvent(ctx, "create", true)
	RecordUserEvent(ctx, "update", true)
}