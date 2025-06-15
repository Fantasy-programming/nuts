package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/shopspring/decimal"
)

func fetchExchangeRates(ctx context.Context, baseCurrency string) (map[string]decimal.Decimal, error) {
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

	decoder := json.NewDecoder(resp.Body)
	decoder.UseNumber()

	var rawResult map[string]any
	if err := decoder.Decode(&rawResult); err != nil {
		return nil, err
	}

	baseCurrencyLower := strings.ToLower(baseCurrency)
	ratesInterface, ok := rawResult[baseCurrencyLower]
	if !ok {
		return nil, fmt.Errorf("no rates found for base currency: %s", baseCurrency)
	}

	ratesMap, ok := ratesInterface.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("unexpected rates format")
	}

	// CHANGE: The rates map is now of type decimal.Decimal
	rates := make(map[string]decimal.Decimal)
	for currency, rateInterface := range ratesMap {
		// CHANGE: Assert the type to json.Number
		if rateNum, ok := rateInterface.(json.Number); ok {
			// CHANGE: Parse the string representation into a decimal
			d, err := decimal.NewFromString(rateNum.String())
			if err != nil {
				// Handle or log cases where a rate isn't a valid number
				continue
			}
			rates[strings.TrimSpace(strings.ToUpper(currency))] = d
		}
	}

	return rates, nil
}
