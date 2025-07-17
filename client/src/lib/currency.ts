import { api } from '@/lib/axios';

export interface ExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  effective_date: string;
  created_at: string;
  updated_at: string;
}

export interface ConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  exchangeRate: number;
  effectiveDate: string;
}

/**
 * Get exchange rate between two currencies
 */
export async function getExchangeRate(
  fromCurrency: string, 
  toCurrency: string, 
  date?: string
): Promise<ExchangeRate | null> {
  try {
    const params = new URLSearchParams({
      from: fromCurrency,
      to: toCurrency,
    });
    
    if (date) {
      params.append('date', date);
    }

    const response = await api.get(`/exchange-rates?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return null;
  }
}

/**
 * Convert amount between currencies
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  date?: string
): Promise<ConversionResult | null> {
  // If currencies are the same, no conversion needed
  if (fromCurrency === toCurrency) {
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: amount,
      convertedCurrency: toCurrency,
      exchangeRate: 1.0,
      effectiveDate: new Date().toISOString().split('T')[0],
    };
  }

  try {
    const exchangeRate = await getExchangeRate(fromCurrency, toCurrency, date);
    
    if (!exchangeRate) {
      throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
    }

    const convertedAmount = amount * exchangeRate.rate;

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount,
      convertedCurrency: toCurrency,
      exchangeRate: exchangeRate.rate,
      effectiveDate: exchangeRate.effective_date,
    };
  } catch (error) {
    console.error('Error converting currency:', error);
    return null;
  }
}

/**
 * Convert multiple amounts to a target currency
 */
export async function convertMultipleCurrencies(
  amounts: Array<{ amount: number; currency: string }>,
  targetCurrency: string,
  date?: string
): Promise<Array<ConversionResult | null>> {
  const results: Array<ConversionResult | null> = [];
  
  for (const { amount, currency } of amounts) {
    const result = await convertCurrency(amount, currency, targetCurrency, date);
    results.push(result);
  }
  
  return results;
}

/**
 * Get latest exchange rates for a base currency
 */
export async function getLatestExchangeRates(baseCurrency: string): Promise<ExchangeRate[]> {
  try {
    const response = await api.get(`/exchange-rates/latest?base=${baseCurrency}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching latest exchange rates:', error);
    return [];
  }
}

/**
 * Currency conversion utilities that integrate with preferences
 */
export class CurrencyConverter {
  private exchangeRateCache: Map<string, { rate: ExchangeRate; timestamp: number }> = new Map();
  private readonly cacheExpiry = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached exchange rate or fetch from API
   */
  private async getCachedExchangeRate(
    fromCurrency: string, 
    toCurrency: string, 
    date?: string
  ): Promise<ExchangeRate | null> {
    const cacheKey = `${fromCurrency}-${toCurrency}-${date || 'latest'}`;
    const cached = this.exchangeRateCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.rate;
    }

    const rate = await getExchangeRate(fromCurrency, toCurrency, date);
    
    if (rate) {
      this.exchangeRateCache.set(cacheKey, {
        rate,
        timestamp: Date.now()
      });
    }
    
    return rate;
  }

  /**
   * Convert amount with caching
   */
  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date?: string
  ): Promise<ConversionResult | null> {
    if (fromCurrency === toCurrency) {
      return {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount: amount,
        convertedCurrency: toCurrency,
        exchangeRate: 1.0,
        effectiveDate: new Date().toISOString().split('T')[0],
      };
    }

    const exchangeRate = await this.getCachedExchangeRate(fromCurrency, toCurrency, date);
    
    if (!exchangeRate) {
      return null;
    }

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: amount * exchangeRate.rate,
      convertedCurrency: toCurrency,
      exchangeRate: exchangeRate.rate,
      effectiveDate: exchangeRate.effective_date,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.exchangeRateCache.clear();
  }
}

// Export a singleton instance
export const currencyConverter = new CurrencyConverter();