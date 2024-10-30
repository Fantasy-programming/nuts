package main

import "github.com/Fantasy-Programming/nuts/internal/server"

var version = "0.0.1"

func main() {
	server := server.New(server.WithVersion(version))
	server.Init()
	server.Run()
}
