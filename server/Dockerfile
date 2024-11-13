FROM golang:1.23 AS src

WORKDIR /go/src/app/

# Copy dependencies first to take advantage of Docker caching
COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY . ./

ENV CGO_ENABLED=0

# Insert version using git tag and latest commit hash
RUN go build -ldflags="-X main.Version=$(git describe --abbrev=0 --tags)-$(git rev-list -1 HEAD) -s" -o ./server ./cmd/api/main.go

FROM gcr.io/distroless/static-debian12:nonroot

LABEL com.example.maintainers="Rich <ridy@example.com>"

COPY --from=src /go/src/app/server /usr/bin/local/server

ARG API_PORT
ENV API_PORT=${API_PORT}

EXPOSE ${API_PORT}

ENTRYPOINT ["/usr/bin/local/server"]
