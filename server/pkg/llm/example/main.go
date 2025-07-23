package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/Fantasy-Programming/nuts/server/pkg/llm"
	"github.com/rs/zerolog"
)

func main() {
	// Create logger
	logger := zerolog.New(os.Stdout).With().Timestamp().Logger()

	// Create LLM service with configuration
	config := llm.NewConfig()
	service, err := llm.NewService(config, &logger)
	if err != nil {
		log.Fatalf("Failed to create LLM service: %v", err)
	}

	// Example inputs to test
	examples := []string{
		"Bought coffee at Starbucks for $4.50 this morning",
		"Had lunch for $15 and filled up gas tank for $45 yesterday", 
		"Got my salary of $3000 deposited on Friday",
		"Transferred $500 from checking to savings account",
		"Grocery shopping at Whole Foods spent about $85",
		"ATM withdrawal $50 cash at downtown branch",
	}

	// Test each example
	for i, input := range examples {
		fmt.Printf("\n=== Example %d ===\n", i+1)
		fmt.Printf("Input: %s\n", input)
		
		request := llm.NeuralInputRequest{
			Input:          input,
			BaseCurrency:   stringPtr("USD"),
			UserTimezone:   stringPtr("America/New_York"),
			AccountContext: stringPtr("Personal checking account"),
		}

		response, err := service.ParseTransactions(context.Background(), request)
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			continue
		}

		fmt.Printf("Model: %s (%s)\n", response.Model, response.Provider)
		fmt.Printf("Parsed %d transaction(s):\n", len(response.Transactions))
		
		for j, txn := range response.Transactions {
			fmt.Printf("  %d. Amount: $%s, Type: %s", j+1, txn.Amount.String(), txn.Type)
			if txn.Description != nil {
				fmt.Printf(", Description: %s", *txn.Description)
			}
			if txn.CategoryHint != nil {
				fmt.Printf(", Category: %s", *txn.CategoryHint)
			}
			if txn.MerchantName != nil {
				fmt.Printf(", Merchant: %s", *txn.MerchantName)
			}
			fmt.Printf(", Confidence: %.2f\n", txn.Confidence)
		}
	}
}

// Helper function
func stringPtr(s string) *string {
	return &s
}