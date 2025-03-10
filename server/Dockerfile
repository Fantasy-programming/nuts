FROM golang:1.23 AS src

WORKDIR /go/src/app/

# Copy dependencies first to take advantage of Docker caching
COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY . ./

ENV CGO_ENABLED=0

# Insert version using git tag and latest commit hash
RUN go build -o ./server ./cmd/api/main.go && \
  go build -o ./healthcheck ./cmd/health/main.go


FROM gcr.io/distroless/static-debian12:nonroot

LABEL com.example.maintainers="Rich <ridy@example.com>"

WORKDIR /usr/bin/local 

COPY --from=src /go/src/app/locales /usr/bin/local/locales
COPY --from=src /go/src/app/server /usr/bin/local/server
COPY --from=src /go/src/app/healthcheck /usr/bin/local/healthcheck

ARG API_PORT
ENV API_PORT=${API_PORT}

EXPOSE ${API_PORT}

ENTRYPOINT ["/usr/bin/local/server"]
