# Single-image deploy: Go API + built React frontend served from one origin
# (avoids cross-site cookie/CORS issues with the session-cookie auth).

# ---- Stage 1: build the frontend ----
FROM node:22-alpine AS web-build
WORKDIR /app/web
RUN corepack enable
COPY web/package.json web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY web/ ./
RUN pnpm run build

# ---- Stage 2: build the Go binaries ----
FROM golang:1.25-alpine AS go-build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/server ./cmd/server
RUN CGO_ENABLED=0 go build -o /out/migrate ./cmd/migrate

# ---- Stage 3: minimal runtime ----
FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=go-build /out/server ./server
COPY --from=go-build /out/migrate ./migrate
COPY --from=web-build /app/web/dist ./web/dist

# Railway injects $PORT; the Go server already reads it (default 8080).
EXPOSE 8080
# Migrations are additive/idempotent — safe to run on every boot.
CMD ["sh", "-c", "./migrate && ./server"]
