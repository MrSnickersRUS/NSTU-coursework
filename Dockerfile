# Stage 1: Build
FROM golang:1.23-alpine AS builder
ENV GOTOOLCHAIN=auto

WORKDIR /app

# Copy backend source
COPY backend/ ./

# Download dependencies
RUN go mod download

# Build the server
RUN go build -o server ./cmd/server

# Stage 2: Runtime
FROM alpine:latest

WORKDIR /root/

# Install certificates
RUN apk --no-cache add ca-certificates

# Copy binary from builder
COPY --from=builder /app/server .

# Copy migrations
COPY --from=builder /app/migrations ./migrations

# Copy frontend
COPY frontend/ ./frontend/

# Expose port
EXPOSE 8080

# Run
CMD ["./server"]