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
CMD ["./main"]
