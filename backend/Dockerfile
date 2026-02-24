# =============================================================================
# Team360 Backend API - Multi-stage Dockerfile
# Security: Non-root user, minimal base image, no secrets in layers
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build
# -----------------------------------------------------------------------------
FROM golang:1.25-alpine AS builder

# Build arguments for version info (no secrets!)
ARG VERSION=dev
ARG COMMIT=unknown

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Create non-root user for build
RUN adduser -D -g '' appuser

WORKDIR /build

# Copy go mod files first (better layer caching)
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary
# - CGO_ENABLED=0: Pure Go binary (no C dependencies)
# - -ldflags: Strip debug info and embed version
# - -trimpath: Remove file paths from binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-s -w -X main.Version=${VERSION} -X main.Commit=${COMMIT}" \
    -trimpath \
    -o /build/team360-api \
    cmd/api/main.go

# -----------------------------------------------------------------------------
# Stage 2: Runtime (alpine for migration files + wget health check)
# -----------------------------------------------------------------------------
FROM alpine:3.21

# Install runtime dependencies (wget for health check, ca-certs for TLS)
RUN apk add --no-cache ca-certificates tzdata wget

# Create non-root user
RUN adduser -D -g '' appuser

WORKDIR /app

# Copy binary
COPY --from=builder /build/team360-api ./team360-api

# Copy migration SQL files (required by golang-migrate file:// source at runtime)
COPY --from=builder /build/infrastructure/persistence/postgres/migrations/ \
    ./infrastructure/persistence/postgres/migrations/

# Use non-root user
USER appuser

# Expose port (documentation only - doesn't publish)
EXPOSE 8080

# Health check using wget (available in alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:8080/health || exit 1

# Run the binary
ENTRYPOINT ["./team360-api"]
