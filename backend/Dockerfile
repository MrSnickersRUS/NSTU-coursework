# Stage 1: Build
FROM golang:1.23-alpine AS builder

# Enable automatic toolchain download for newer Go requirements
ENV GOTOOLCHAIN=auto

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

RUN go mod download

# Copy source code
COPY . .

# Build backend (toolchain will auto-download if needed)
RUN go build -o /app/server ./cmd/server

# Stage 2: Runtime
FROM alpine:latest

WORKDIR /root/

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates

# Copy binary from builder
COPY --from=builder /app/server .

# Copy migrations (if needed)
COPY --from=builder /app/migrations ./migrations

# Expose port
EXPOSE 8080

# Run
CMD ["./server"]
