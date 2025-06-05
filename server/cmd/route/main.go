package main

import "github.com/Fantasy-Programming/nuts/server/internal/server"

func main() {
	server := server.New()
	server.NewRouter()
	server.NewLogger()
	server.RegisterDomain()
	server.ListRoutes()
}
