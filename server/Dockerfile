FROM golang:1.23-alpine AS src

WORKDIR /go/src/app/

COPY go.mod go.sum ./
RUN go mod download

# Copy the entire monorepo contents into the container.
# This includes all subdirectories like 'server', 'common', etc.
COPY server/ ./server/

ENV CGO_ENABLED=0
ENV GOOS=linux

# Build the binaries. The paths are now relative to the WORKDIR (/go/src/app/).
# So, 'server' (where the Dockerfile is) is now a subdirectory.
RUN go build -a -ldflags="-s -w" -o ./server-binary ./server/cmd/api/main.go && \
  go build -a -ldflags="-s -w" -o ./healthcheck-binary ./server/cmd/health/main.go


FROM gcr.io/distroless/static-debian12:nonroot

LABEL com.example.maintainers="Rich <ridy@example.com>"

WORKDIR /usr/bin/local

# Copy locales and binaries from the build stage.
# Adjust paths: /go/src/app/ is the monorepo root in the src stage.
# So, locales will be at /go/src/app/server/locales if they were in the 'server' directory.
COPY --from=src /go/src/app/server/locales /usr/bin/local/locales
COPY --from=src /go/src/app/server-binary /usr/bin/local/server
COPY --from=src /go/src/app/healthcheck-binary /usr/bin/local/healthcheck

ARG API_PORT
ENV API_PORT=${API_PORT}

EXPOSE ${API_PORT}

ENTRYPOINT ["/usr/bin/local/server"]
