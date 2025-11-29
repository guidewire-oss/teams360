# Team360 Observability Guide

Team360 provides comprehensive observability through **metrics**, **distributed tracing**, and **structured logging**. The system is designed to be backend-agnostic, allowing you to use your preferred observability platform.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start](#quick-start)
3. [Metrics](#metrics)
   - [User Engagement Metrics](#user-engagement-metrics)
   - [Survey/Health Check Metrics](#surveyhealth-check-metrics)
   - [Team Health Metrics](#team-health-metrics)
   - [Dashboard Engagement Metrics](#dashboard-engagement-metrics)
   - [API Performance Metrics](#api-performance-metrics)
   - [Database Metrics](#database-metrics)
4. [Distributed Tracing](#distributed-tracing)
5. [Structured Logging](#structured-logging)
6. [Grafana Dashboard](#grafana-dashboard)
7. [Alternative Backends](#alternative-backends)
   - [Datadog Configuration](#datadog-configuration)
   - [Honeycomb Configuration](#honeycomb-configuration)
8. [Production Considerations](#production-considerations)

---

## Architecture Overview

Team360 uses **OpenTelemetry (OTel)** as the telemetry standard, providing vendor-agnostic instrumentation:

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│  Go Backend     │─────▶│  OTel Collector  │─────▶│  Observability      │
│  (Gin + OTel)   │      │  (traces/metrics)│      │  Backend            │
└─────────────────┘      └──────────────────┘      │  - Prometheus       │
                                │                   │  - Jaeger           │
┌─────────────────┐             │                   │  - Datadog          │
│  Next.js        │─────────────┘                   │  - Honeycomb        │
│  Frontend       │                                 │  - Grafana Cloud    │
└─────────────────┘                                 └─────────────────────┘
```

**Key Components:**

| Component | Purpose | Port |
|-----------|---------|------|
| OTel Collector | Receives, processes, and exports telemetry | 4317 (gRPC), 4318 (HTTP) |
| Prometheus | Time-series metrics storage | 9090 |
| Jaeger | Distributed trace visualization | 16686 |
| Grafana | Dashboards and visualization | 3001 |

---

## Quick Start

### 1. Start the Observability Stack

```bash
# Start all observability services
cd backend/deploy
docker-compose -f docker-compose.observability.yaml up -d

# Verify services are running
docker-compose -f docker-compose.observability.yaml ps
```

### 2. Start the Backend with Telemetry

```bash
# From repository root
export OTEL_ENABLED=true
export OTEL_EXPORTER_OTLP_ENDPOINT=localhost:4317
make run-backend

# Or use the combined command
make run-with-otel
```

### 3. Access the Tools

| Tool | URL | Purpose |
|------|-----|---------|
| Grafana | http://localhost:3001 | Dashboards (admin/admin) |
| Prometheus | http://localhost:9090 | Metrics queries |
| Jaeger | http://localhost:16686 | Trace visualization |

---

## Metrics

Team360 exposes 40+ metrics organized into six categories. All metrics use the `teams360_` prefix when exported through Prometheus.

### User Engagement Metrics

These metrics track user activity and session behavior:

| Metric Name | Type | Description | Labels |
|-------------|------|-------------|--------|
| `session.active.total` | UpDownCounter | Currently active user sessions | - |
| `session.duration` | Histogram | User session duration in seconds | `user_id` |
| `auth.login.total` | Counter | Total login attempts | `success`, `reason` |
| `auth.login.duration` | Histogram | Login operation latency | `success` |
| `auth.logout.total` | Counter | Total logout operations | - |
| `auth.token.refresh.total` | Counter | Token refresh operations | `success`, `reason` |
| `auth.failures.total` | Counter | Authentication failures | `type`, `reason` |
| `auth.password_reset.request.total` | Counter | Password reset requests | `user_found` |
| `auth.password_reset.complete.total` | Counter | Completed password resets | `success`, `reason` |
| `engagement.page_views.total` | Counter | Page/endpoint views | `page`, `role` |
| `engagement.feature_usage.total` | Counter | Feature usage tracking | `feature`, `role` |
| `engagement.return_visits.total` | Counter | Returning user visits | `user_id` |
| `engagement.dau` | Gauge | Daily active users | - |
| `engagement.wau` | Gauge | Weekly active users | - |
| `engagement.mau` | Gauge | Monthly active users | - |

**Histogram Buckets (Login Duration):** 10ms, 50ms, 100ms, 250ms, 500ms, 1s, 2.5s, 5s, 10s

**Histogram Buckets (Session Duration):** 1m, 5m, 10m, 30m, 1h, 2h, 4h, 8h

**Use Cases:**
- Monitor active user count in real-time
- Track login success/failure rates
- Identify authentication bottlenecks
- Measure user engagement patterns

### Survey/Health Check Metrics

Track health check survey submissions and completion:

| Metric Name | Type | Description | Labels |
|-------------|------|-------------|--------|
| `survey.submitted.total` | Counter | Surveys submitted | `team_id`, `assessment_period` |
| `survey.submit.duration` | Histogram | Survey submission latency | `team_id`, `assessment_period` |
| `survey.responses.total` | Counter | Individual dimension responses | `team_id`, `assessment_period` |
| `survey.dimension.score` | Histogram | Score distribution (1-3) | `dimension_id`, `trend` |
| `survey.completion.rate` | Gauge | Completion rate per team | `team_id` |
| `survey.sessions.active` | UpDownCounter | Active survey sessions | - |
| `survey.started.total` | Counter | Surveys started (page loaded) | `team_id` |
| `survey.abandoned.total` | Counter | Abandoned surveys | `team_id`, `abandoned_at` |
| `survey.time_to_complete` | Histogram | Time from start to submit | `team_id` |
| `survey.comments.total` | Counter | Responses with comments | `team_id`, `dimension_id` |
| `survey.comment_rate` | Gauge | % of responses with comments | `team_id` |

**Histogram Buckets (Dimension Score):** 1.0, 1.5, 2.0, 2.5, 3.0

**Histogram Buckets (Time to Complete):** 30s, 1m, 2m, 3m, 5m, 10m, 15m, 30m

**Use Cases:**
- Track survey participation rates
- Identify teams with low completion rates
- Analyze score distributions
- Detect survey abandonment patterns

### Team Health Metrics

Business metrics for team health analysis:

| Metric Name | Type | Description | Labels |
|-------------|------|-------------|--------|
| `team.health.queries.total` | Counter | Health data queries | `team_id` |
| `team.health.query.duration` | Histogram | Query latency | `team_id` |
| `team.active.total` | Gauge | Active teams count | - |
| `team.at_risk.total` | Gauge | Teams with health < 2.0 | - |
| `team.health.average` | Gauge | Org-wide average health | - |
| `team.health.by_dimension` | Histogram | Health by dimension | `dimension_id` |
| `team.improving.total` | Counter | Teams showing improvement | `team_id` |
| `team.declining.total` | Counter | Teams showing decline | `team_id` |

**Use Cases:**
- Monitor organization health trends
- Identify at-risk teams needing support
- Track improvement/decline patterns

### Dashboard Engagement Metrics

Track how users interact with dashboards:

| Metric Name | Type | Description | Labels |
|-------------|------|-------------|--------|
| `dashboard.manager.views.total` | Counter | Manager dashboard views | `manager_id`, `view_type` |
| `dashboard.teamlead.views.total` | Counter | Team lead dashboard views | `team_lead_id`, `view_type` |
| `dashboard.trends.views.total` | Counter | Trend report views | `user_id`, `report_type` |
| `dashboard.exports.total` | Counter | Report exports | `export_type`, `format` |

**View Types:** `teams_health`, `radar`, `trends`, `health_summary`, `response_distribution`, `individual_responses`

**Use Cases:**
- Measure dashboard adoption
- Identify most-used features
- Track reporting usage

### API Performance Metrics

Monitor HTTP and API performance:

| Metric Name | Type | Description | Labels |
|-------------|------|-------------|--------|
| `api.latency.by_endpoint` | Histogram | Endpoint latency (ms) | `endpoint`, `method`, `status_code` |
| `api.errors.by_endpoint` | Counter | API errors | `endpoint`, `method`, `status_code`, `error_type` |
| `http.requests.inflight` | UpDownCounter | Current inflight requests | - |
| `ratelimit.exceeded.total` | Counter | Rate limit violations | `endpoint` |

**Histogram Buckets (Latency):** 5ms, 10ms, 25ms, 50ms, 100ms, 250ms, 500ms, 1s, 2.5s, 5s

**Use Cases:**
- Monitor API latency percentiles (p50, p95, p99)
- Track error rates by endpoint
- Identify slow endpoints
- Detect rate limiting issues

### Database Metrics

Monitor database performance:

| Metric Name | Type | Description | Labels |
|-------------|------|-------------|--------|
| `db.query.total` | Counter | Database queries | `operation`, `table` |
| `db.query.duration` | Histogram | Query latency | `operation`, `table` |
| `db.errors.total` | Counter | Database errors | `operation`, `table` |
| `db.connections.active` | UpDownCounter | Active connections | - |

**Histogram Buckets (Query Duration):** 1ms, 5ms, 10ms, 25ms, 50ms, 100ms, 250ms, 500ms, 1s

**Use Cases:**
- Identify slow queries
- Monitor connection pool usage
- Track error rates by table/operation

---

## Distributed Tracing

Team360 implements distributed tracing using OpenTelemetry with named tracers for different domains:

### Tracer Names

| Tracer | Purpose | Example Spans |
|--------|---------|---------------|
| `teams360.auth` | Authentication flows | `login`, `logout`, `token_refresh` |
| `teams360.healthcheck` | Survey operations | `submit`, `get_by_id`, `get_team_sessions`, `get_dimensions` |
| `teams360.team` | Team operations | `get_health`, `get_members` |
| `teams360.user` | User management | `get_profile`, `update_profile` |
| `teams360.database` | Database operations | `query`, `insert`, `update` |

### Span Attributes

Each span includes relevant business context:

```go
// Health Check Span Attributes
span.SetAttributes(
    attribute.String("healthcheck.id", id),
    attribute.String("team.id", teamID),
    attribute.String("healthcheck.assessment_period", period),
    attribute.Int("healthcheck.dimension_count", count),
    attribute.Bool("survey.complete", completed),
)
```

### Trace Context Propagation

Team360 uses W3C TraceContext for distributed tracing across services:

```go
// Propagators configured in telemetry initialization
otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
    propagation.TraceContext{},
    propagation.Baggage{},
))
```

### PII Protection

Sensitive data is masked in traces:

```go
// Username masking: "johndoe" -> "jo***e"
func maskUsername(username string) string {
    if len(username) <= 3 {
        return "***"
    }
    return username[:2] + "***" + string(username[len(username)-1])
}
```

---

## Structured Logging

Team360 uses **zerolog** for high-performance structured logging with automatic trace correlation.

### Log Levels

| Level | Usage |
|-------|-------|
| `debug` | Development troubleshooting, successful DB operations |
| `info` | Normal operations, successful requests |
| `warn` | Recoverable issues, auth failures, security events |
| `error` | Failures requiring attention, 5xx responses |
| `fatal` | Unrecoverable errors causing shutdown |

### Automatic Context Enrichment

Logs automatically include trace context for correlation:

```json
{
  "level": "info",
  "time": "2024-01-15T10:30:00Z",
  "request_id": "req-abc123",
  "user_id": "user-456",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "span_id": "00f067aa0ba902b7",
  "message": "health check submitted successfully"
}
```

### Specialized Log Events

**Authentication Events:**
```go
log.Auth("login").
    Username("johndoe").  // Automatically masked
    IP("192.168.1.1").
    Success()

// Output: {"component":"auth","action":"login","username":"jo***e","client_ip":"192.168.1.1","msg":"auth_success"}
```

**Database Events:**
```go
log.DB("query").
    Table("health_check_sessions").
    Duration(15 * time.Millisecond).
    Context("fetching team health data").
    Success()
```

**HTTP Events:**
```go
log.HTTP().
    Method("POST").
    Path("/api/v1/health-checks").
    Status(201).
    Duration(150 * time.Millisecond).
    RequestID("req-abc123").
    Log()
```

**Security Events:**
```go
log.Security("rate_limit_exceeded").
    IP("192.168.1.1").
    Endpoint("/api/v1/auth/login").
    Details("exceeded 100 requests per minute").
    Log()
```

### Configuration

```go
logger.Init(logger.Config{
    Level:  "info",   // debug, info, warn, error
    Pretty: true,     // Human-readable for dev, JSON for prod
    Output: os.Stdout,
})
```

---

## Grafana Dashboard

Team360 ships with a pre-configured Grafana dashboard (`Team360 Product Analytics`) containing 18 panels organized into three sections.

### User Engagement Overview

| Panel | Type | Metric | Purpose |
|-------|------|--------|---------|
| Active Sessions | Stat | `teams360_session_active_total` | Current logged-in users |
| Total Successful Logins | Stat | `sum(teams360_auth_login_total{success="true"})` | Login count |
| Total Logouts | Stat | `sum(teams360_auth_logout_total)` | Logout count |
| Login Latency (p50) | Stat | `histogram_quantile(0.50, ...)` | Median login time |
| Login Activity | Time Series | `increase(teams360_auth_login_total[5m])` | Login trends over time |
| Login Latency Distribution | Time Series | p50, p95, p99 percentiles | Latency distribution |

### Survey Analytics

| Panel | Type | Metric | Purpose |
|-------|------|--------|---------|
| Total Surveys Submitted | Stat | `sum(teams360_survey_submitted_total)` | Survey count |
| Total Dimension Responses | Stat | `sum(teams360_survey_responses_total)` | Response count |
| Survey Submit Time (p50) | Stat | `histogram_quantile(0.50, ...)` | Submission latency |
| Avg Health Score | Stat | `sum/count of dimension scores` | Organization health |
| Submissions Over Time | Time Series | By team_id | Participation trends |
| Health by Dimension | Bar Chart | Avg score by dimension | Dimension analysis |

### API Performance

| Panel | Type | Metric | Purpose |
|-------|------|--------|---------|
| HTTP Request Latency | Time Series | p50, p95 by route | Endpoint performance |
| Requests per Second | Time Series | Rate by route | Traffic patterns |
| Database Query Latency | Time Series | p50, p95, p99 | DB performance |
| HTTP Response Status | Time Series | Count by status code | Error monitoring |

---

## Alternative Backends

### Datadog Configuration

To send telemetry to Datadog instead of the local stack:

**1. Update OTel Collector Configuration**

Create `collector-datadog.yaml`:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: "0.0.0.0:4317"
      http:
        endpoint: "0.0.0.0:4318"

processors:
  batch:
    timeout: 10s
    send_batch_size: 1000

  resource:
    attributes:
      - key: deployment.environment
        value: production
        action: upsert

exporters:
  datadog:
    api:
      key: ${DD_API_KEY}
      site: datadoghq.com  # or datadoghq.eu for EU
    traces:
      span_name_as_resource_name: true
    metrics:
      resource_attributes_as_tags: true
      histograms:
        mode: distributions
        send_aggregation_metrics: true

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [datadog]
    metrics:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [datadog]
```

**2. Set Environment Variables**

```bash
export DD_API_KEY=your-datadog-api-key
export DD_SITE=datadoghq.com
export OTEL_ENABLED=true
export OTEL_EXPORTER_OTLP_ENDPOINT=localhost:4317
```

**3. Run the Collector**

```bash
docker run -d \
  -e DD_API_KEY \
  -v $(pwd)/collector-datadog.yaml:/etc/otel/config.yaml \
  -p 4317:4317 -p 4318:4318 \
  otel/opentelemetry-collector-contrib:latest \
  --config /etc/otel/config.yaml
```

**Datadog-Specific Features:**
- Automatic service mapping
- APM trace correlation
- Unified dashboards with infrastructure metrics
- Anomaly detection
- SLO tracking

### Honeycomb Configuration

To send telemetry to Honeycomb:

**1. Update OTel Collector Configuration**

Create `collector-honeycomb.yaml`:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: "0.0.0.0:4317"
      http:
        endpoint: "0.0.0.0:4318"

processors:
  batch:
    timeout: 5s
    send_batch_size: 500

exporters:
  otlp/honeycomb-traces:
    endpoint: "api.honeycomb.io:443"
    headers:
      "x-honeycomb-team": ${HONEYCOMB_API_KEY}
      "x-honeycomb-dataset": teams360-traces

  otlp/honeycomb-metrics:
    endpoint: "api.honeycomb.io:443"
    headers:
      "x-honeycomb-team": ${HONEYCOMB_API_KEY}
      "x-honeycomb-dataset": teams360-metrics

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp/honeycomb-traces]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp/honeycomb-metrics]
```

**2. Set Environment Variables**

```bash
export HONEYCOMB_API_KEY=your-honeycomb-api-key
export OTEL_ENABLED=true
export OTEL_EXPORTER_OTLP_ENDPOINT=localhost:4317
```

**3. Run the Collector**

```bash
docker run -d \
  -e HONEYCOMB_API_KEY \
  -v $(pwd)/collector-honeycomb.yaml:/etc/otel/config.yaml \
  -p 4317:4317 -p 4318:4318 \
  otel/opentelemetry-collector-contrib:latest \
  --config /etc/otel/config.yaml
```

**Honeycomb-Specific Features:**
- BubbleUp for automatic analysis
- High-cardinality support (user_id, team_id as first-class dimensions)
- SLOs with burn alerts
- Query-driven exploration

### Other Supported Backends

The OTel Collector supports 50+ backends. Common alternatives:

| Backend | Exporter | Notes |
|---------|----------|-------|
| Grafana Cloud | `otlp` | Use Grafana's OTLP endpoint |
| New Relic | `otlp` | Native OTLP support |
| Splunk | `splunk_hec` | Splunk HEC exporter |
| AWS X-Ray | `awsxray` | AWS native tracing |
| Google Cloud | `googlecloud` | GCP operations suite |
| Elastic APM | `elasticsearch` | Elastic observability |

---

## Production Considerations

### Sample Rate Configuration

Adjust sampling in production to reduce costs:

```go
// In telemetry.go
Config{
    SampleRate: 0.1,  // 10% sampling for high-traffic
}
```

Or use adaptive sampling:
```go
sampler := trace.ParentBased(
    trace.TraceIDRatioBased(0.1),  // 10% baseline
    trace.WithRemoteParentSampled(trace.AlwaysSample()),  // Honor upstream decisions
)
```

### Metric Cardinality

High-cardinality labels can cause storage issues. Team360 limits cardinality by:
- Not including `user_id` on high-volume metrics
- Using `team_id` selectively (11 teams max by default)
- Aggregating paths/endpoints rather than full URLs

### Resource Limits

Configure collector memory limits:
```yaml
processors:
  memory_limiter:
    check_interval: 1s
    limit_mib: 1024      # Production limit
    spike_limit_mib: 256
```

### Security

For production:
1. Enable TLS for OTLP endpoints
2. Use authentication tokens
3. Restrict collector access via network policies
4. Mask PII in spans (implemented in tracer.go)

```yaml
# Production collector with TLS
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: "0.0.0.0:4317"
        tls:
          cert_file: /etc/otel/server.crt
          key_file: /etc/otel/server.key
```

### High Availability

For production, deploy multiple collectors behind a load balancer:

```yaml
# kubernetes deployment example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: otel-collector
spec:
  replicas: 3
  selector:
    matchLabels:
      app: otel-collector
```

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `OTEL_ENABLED` | `false` | Enable telemetry export |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `localhost:4317` | OTel Collector endpoint |
| `ENVIRONMENT` | `development` | Environment name (added to all telemetry) |
| `LOG_LEVEL` | `info` | Logging level |
| `LOG_PRETTY` | `false` | Human-readable logs (dev only) |

---

## Troubleshooting

### Metrics not appearing in Prometheus

1. Check collector health: `curl http://localhost:13133/`
2. Verify metrics endpoint: `curl http://localhost:8889/metrics | grep teams360`
3. Check Prometheus targets: http://localhost:9090/targets

### Traces not appearing in Jaeger

1. Verify collector is receiving traces: Check collector logs
2. Ensure `OTEL_ENABLED=true` is set
3. Check Jaeger UI search with service name `teams360-api`

### High memory usage

1. Reduce batch sizes in collector config
2. Lower metric cardinality
3. Increase `memory_limiter` check frequency

### Log correlation not working

Ensure trace context is propagated:
```go
log := logger.Get().WithContext(ctx)
log.Info("message")  // Will include trace_id, span_id
```
