# Build stage
FROM golang:1.26-alpine AS build-stage
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Production stage
FROM alpine:3.18
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=build-stage /app/main .
EXPOSE 5001
# Run as a fixed non-root user (INFRA-19, PSA restricted). Mounted volumes are
# made writable by the pod's fsGroup.
RUN addgroup -S -g 10001 app && adduser -S -D -H -u 10001 -G app -h /app app
USER 10001:10001

CMD ["./main"]
