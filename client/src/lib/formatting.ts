import { usePreferencesStore } from '@/features/preferences/stores/preferences.store';
import getSymbolFromCurrency from 'currency-symbol-map';

/**
 * Format a date according to user preferences
 */
export function formatDate(date: Date | string, preferences?: {
  date_format?: string;
  locale?: string;
}): string {
  const actualDate = typeof date === 'string' ? new Date(date) : date;
  
  if (!preferences) {
    const state = usePreferencesStore.getState();
    preferences = {
      date_format: state.date_format,
      locale: state.locale
    };
  }

  const { date_format, locale } = preferences;

  try {
    switch (date_format) {
      case 'dd/mm/yyyy':
        return actualDate.toLocaleDateString(locale || 'en-US', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      case 'mm/dd/yyyy':
        return actualDate.toLocaleDateString(locale || 'en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        });
      case 'yyyy-mm-dd':
        return actualDate.toISOString().split('T')[0];
      default:
        return actualDate.toLocaleDateString(locale || 'en-US');
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return actualDate.toLocaleDateString('en-US');
  }
}

/**
 * Format a time according to user preferences
 */
export function formatTime(date: Date | string, preferences?: {
  time_format?: string;
  locale?: string;
}): string {
  const actualDate = typeof date === 'string' ? new Date(date) : date;
  
  if (!preferences) {
    const state = usePreferencesStore.getState();
    preferences = {
      time_format: state.time_format,
      locale: state.locale
    };
  }

  const { time_format, locale } = preferences;

  try {
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit'
    };

    if (time_format === '12h') {
      options.hour12 = true;
    } else if (time_format === '24h') {
      options.hour12 = false;
    }

    return actualDate.toLocaleTimeString(locale || 'en-US', options);
  } catch (error) {
    console.error('Error formatting time:', error);
    return actualDate.toLocaleTimeString('en-US');
  }
}

/**
 * Format a date and time according to user preferences
 */
export function formatDateTime(date: Date | string, preferences?: {
  date_format?: string;
  time_format?: string;
  locale?: string;
}): string {
  const actualDate = typeof date === 'string' ? new Date(date) : date;
  
  if (!preferences) {
    const state = usePreferencesStore.getState();
    preferences = {
      date_format: state.date_format,
      time_format: state.time_format,
      locale: state.locale
    };
  }

  const formattedDate = formatDate(actualDate, preferences);
  const formattedTime = formatTime(actualDate, preferences);
  
  return `${formattedDate} ${formattedTime}`;
}

/**
 * Format a currency amount
 */
export function formatCurrency(
  amount: number,
  currency?: string,
  preferences?: {
    locale?: string;
    currency?: string;
  }
): string {
  if (!preferences) {
    const state = usePreferencesStore.getState();
    preferences = {
      locale: state.locale,
      currency: state.currency
    };
  }

  const { locale } = preferences;
  const actualCurrency = currency || preferences.currency || 'USD';

  try {
    return new Intl.NumberFormat(locale || 'en-US', {
      style: 'currency',
      currency: actualCurrency,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    // Fallback to symbol + amount
    const symbol = getSymbolFromCurrency(actualCurrency) || actualCurrency;
    return `${symbol}${amount.toFixed(2)}`;
  }
}

/**
 * Format a number according to user locale
 */
export function formatNumber(
  number: number,
  preferences?: {
    locale?: string;
  },
  options?: Intl.NumberFormatOptions
): string {
  if (!preferences) {
    const state = usePreferencesStore.getState();
    preferences = {
      locale: state.locale
    };
  }

  const { locale } = preferences;

  try {
    return new Intl.NumberFormat(locale || 'en-US', options).format(number);
  } catch (error) {
    console.error('Error formatting number:', error);
    return number.toString();
  }
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  return getSymbolFromCurrency(currencyCode) || currencyCode;
}

/**
 * Hook to get formatting functions with current preferences
 */
export function useFormatting() {
  const preferences = usePreferencesStore((state) => ({
    locale: state.locale,
    currency: state.currency,
    date_format: state.date_format,
    time_format: state.time_format,
  }));

  return {
    formatDate: (date: Date | string) => formatDate(date, preferences),
    formatTime: (date: Date | string) => formatTime(date, preferences),
    formatDateTime: (date: Date | string) => formatDateTime(date, preferences),
    formatCurrency: (amount: number, currency?: string) => formatCurrency(amount, currency, preferences),
    formatNumber: (number: number, options?: Intl.NumberFormatOptions) => formatNumber(number, preferences, options),
    getCurrencySymbol,
  };
}