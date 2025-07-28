# Observability Setup

This document explains the OpenTelemetry and logging setup for the nuts backend.

## Overview

The nuts backend now includes comprehensive observability through:
- **OpenTelemetry** for distributed tracing
- **Enhanced logging** with trace context integration
- **Database query tracing** for PostgreSQL operations
- **HTTP request instrumentation** for all API endpoints

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OTEL_ENABLED` | `true` | Enable/disable OpenTelemetry tracing |
| `OTEL_SERVICE_NAME` | `nuts-backend` | Service name for traces |
| `OTEL_SERVICE_VERSION` | `unknown` | Service version for traces |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | (empty) | OTLP HTTP endpoint for trace export |
| `LOG_LEVEL` | `info` | Log level (trace, debug, info, warn, error, fatal, panic) |
| `ENVIRONMENT` | `development` | Environment (affects log format and defaults) |

### Local Development Setup

For local development with Jaeger:

```bash
# Start Jaeger with Docker
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 14268:14268 \
  -p 4318:4318 \
  -e COLLECTOR_OTLP_ENABLED=true \
  jaegertracing/all-in-one:latest

# Configure environment
export OTEL_ENABLED=true
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
export LOG_LEVEL=debug

# Start the backend
go run ./server/cmd/api
```

Then visit http://localhost:16686 to view traces in Jaeger UI.

## Features

### HTTP Request Tracing
- Every HTTP request creates a trace span when `OTEL_ENABLED=true`
- Includes request method, URL, response status, and duration
- Automatic trace context propagation
- Can be disabled by setting `OTEL_ENABLED=false`

### Database Query Tracing
- All PostgreSQL queries are traced using [otelpgx](https://github.com/exaring/otelpgx)
- Includes SQL statement, execution time, and affected rows
- Error tracking for failed queries
- Configurable via `OTEL_ENABLED` setting
- Zero overhead when telemetry is disabled

### Enhanced Logging
- Structured JSON logging in production
- Console-friendly logging in development
- Automatic trace_id and span_id injection when telemetry is enabled
- Contextual information (request_id, user_id, etc.)
- Works with or without OpenTelemetry enabled

### Example Log Output

```json
{
  "level": "info",
  "time": "2024-01-15T10:30:00Z",
  "trace_id": "4128d29e878cbbc9e873c4625d9e5cd9",
  "span_id": "4b25642f3e1c5176",
  "request_id": "pkrvmpptgkbjq6m/Cij20K5UKX-000001",
  "message": "Login attempt started",
  "handler": "auth.Login",
  "remote_addr": "192.168.1.100",
  "email": "user@example.com"
}
```

### Disabling Telemetry

To completely disable OpenTelemetry tracing:

```bash
export OTEL_ENABLED=false
```

When disabled:
- No HTTP tracing middleware is added
- No database query tracing is configured  
- Logging continues to work without trace context
- Zero performance impact from telemetry
- All existing functionality remains intact

## Production Considerations

### OTLP Exporter Endpoints
- **Jaeger**: `http://jaeger:4318`
- **Honeycomb**: `https://api.honeycomb.io/v1/traces`
- **Grafana Cloud**: `https://traces-prod-{region}.grafana.net/tempo`
- **New Relic**: `https://otlp.nr-data.net/v1/traces`

### Security
- Never log sensitive information (passwords, tokens, etc.)
- Use appropriate log levels in production
- Ensure OTLP endpoints are secured with authentication

### Performance
- Sampling can be configured for high-traffic applications
- Database query logging should be set to appropriate levels
- Consider using asynchronous exporters for production

## Monitoring Alerts

Consider setting up alerts for:
- High error rates in traces
- Slow database queries
- Authentication failures
- Service availability

## Troubleshooting

### No traces appearing
1. Check `OTEL_ENABLED` is set to `true`
2. Verify `OTEL_EXPORTER_OTLP_ENDPOINT` is correct
3. Ensure the OTLP endpoint is reachable
4. Check application logs for telemetry errors

### Missing trace context in logs
1. Ensure requests go through the OTEL HTTP middleware
2. Check that the logger is created with `logging.LoggerWithTraceCtx()`
3. Verify spans are being created properly

### High overhead
1. Adjust log levels to reduce verbosity
2. Configure sampling rates for traces
3. Use asynchronous exporters
4. Monitor resource usage