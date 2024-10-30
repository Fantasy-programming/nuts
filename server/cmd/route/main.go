package main

import "github.com/Fantasy-Programming/nuts/internal/server"

func main() {
	server := server.New()
	server.NewRouter()
	server.RegisterDomain()
	server.ListRoutes()
}
