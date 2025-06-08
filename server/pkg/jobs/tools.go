package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

func fetchExchangeRates(ctx context.Context, baseCurrency string) (map[string]float64, error) {
	url := fmt.Sprintf("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/%s.json",
		strings.ToLower(baseCurrency))

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status: %d", resp.StatusCode)
	}

	var rawResult map[string]any

	if err := json.NewDecoder(resp.Body).Decode(&rawResult); err != nil {
		return nil, err
	}

	// The API structure is: {baseCurrency: {targetCurrency: rate, ...}, date: "YYYY-MM-DD"}
	baseCurrencyLower := strings.ToLower(baseCurrency)
	ratesInterface, ok := rawResult[baseCurrencyLower]

	if !ok {
		return nil, fmt.Errorf("no rates found for base currency: %s", baseCurrency)
	}

	ratesMap, ok := ratesInterface.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("unexpected rates format")
	}

	// Convert to map[string]float64
	rates := make(map[string]float64)
	for currency, rateInterface := range ratesMap {
		if rate, ok := rateInterface.(float64); ok {
			rates[strings.TrimSpace(strings.ToUpper(currency))] = rate
		}
	}

	return rates, nil
}
