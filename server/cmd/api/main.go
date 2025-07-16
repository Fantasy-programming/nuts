package main

import "github.com/Fantasy-Programming/nuts/server/internal/server"

var version = "2.0.0"

func main() {
	server := server.New(server.WithVersion(version))
	server.Init()
	server.Run()
}
