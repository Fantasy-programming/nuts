package main

import (
	"fmt"
	"net/http"
	"os"
	"time"
)

func main() {
	host := os.Getenv("API_HOST")
	port := os.Getenv("API_PORT")
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(fmt.Sprintf("http://%s:%s/api/health", host, port))
	if err != nil || resp.StatusCode != http.StatusOK {
		os.Exit(1)
	}
	os.Exit(0)
}
