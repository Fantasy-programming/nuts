package telemetry_test

// func TestTelemetrySetup(t *testing.T) {
// 	logger := logging.NewLogger()
//
// 	cfg := telemetry.Config{
// 		ServiceName:    "test-service",
// 		ServiceVersion: "v1.0.0",
// 		Environment:    "test",
// 		OTLPEndpoint:   "", // No endpoint for test
// 		Enabled:        true,
// 	}
//
// 	ctx := context.Background()
// 	shutdown, err := telemetry.Setup(ctx, cfg, logger)
// 	require.NoError(t, err)
// 	require.NotNil(t, shutdown)
//
// 	// Verify that the tracer provider is set
// 	tp := otel.GetTracerProvider()
// 	assert.NotNil(t, tp)
//
// 	// Create a tracer and span to verify functionality
// 	tracer := otel.Tracer("test-tracer")
// 	ctx, span := tracer.Start(ctx, "test-span")
// 	assert.True(t, span.IsRecording())
//
// 	// Verify span context
// 	spanCtx := span.SpanContext()
// 	assert.True(t, spanCtx.IsValid())
// 	assert.True(t, spanCtx.HasTraceID())
// 	assert.True(t, spanCtx.HasSpanID())
//
// 	span.End()
//
// 	// Test logger with trace context
// 	contextLogger := logging.LoggerWithTraceCtx(ctx, logger)
// 	assert.NotNil(t, contextLogger)
//
// 	// Cleanup
// 	err = shutdown(ctx)
// 	assert.NoError(t, err)
// }
//
// func TestTelemetryDisabled(t *testing.T) {
// 	logger := logging.NewLogger()
//
// 	cfg := telemetry.Config{
// 		ServiceName:    "test-service",
// 		ServiceVersion: "v1.0.0",
// 		Environment:    "test",
// 		OTLPEndpoint:   "",
// 		Enabled:        false,
// 	}
//
// 	ctx := context.Background()
// 	shutdown, err := telemetry.Setup(ctx, cfg, logger)
// 	require.NoError(t, err)
// 	require.NotNil(t, shutdown)
//
// 	// Cleanup should work even when disabled
// 	err = shutdown(ctx)
// 	assert.NoError(t, err)
// }
//
// func TestDefaultConfig(t *testing.T) {
// 	cfg := telemetry.DefaultConfig()
//
// 	assert.Equal(t, "nuts-backend", cfg.ServiceName)
// 	assert.Equal(t, "unknown", cfg.ServiceVersion)
// 	assert.Equal(t, "development", cfg.Environment)
// 	assert.True(t, cfg.Enabled)
// }

