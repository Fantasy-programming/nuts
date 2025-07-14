import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toCamelCase(str: string) {
  return str
    .toLowerCase()
    .split('-')
    .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

export function getFirstSegment(path: string) {
  return path.split('/')[0];
}


/**
 * Formats a date object to "dd MMMM, yyyy" format.
 * Example: 29 January, 2024
 */
export const formatDate = (date: Date): string => {
  return format(date, "d MMMM, yyyy");
};

/**
 * Returns the weekday given a date.
 * Example: "Monday"
 */
export const getWeekday = (date: Date): string => {
  return format(date, "EEEE");
};


export const formatCurrency = (amount: number, locale = "en-US", currency = "USD") => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount)
};

export const debounce = <F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  waitFor: number,
) => {
  let timeout: NodeJS.Timeout | undefined

  const debounced = (...args: Parameters<F>) => {

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), waitFor)
  }

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = undefined
    }
  }

  return debounced
}
