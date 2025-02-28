import { format } from "date-fns"

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
