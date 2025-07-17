import { z } from "zod";

// Frequency data schema for complex recurrence patterns
export const frequencyDataSchema = z.object({
  day_of_week: z.number().min(0).max(6).optional(), // 0=Sunday, 1=Monday, etc.
  day_of_month: z.number().min(1).max(31).optional(), // 1-31
  week_of_month: z.number().min(-1).max(5).optional(), // 1=first, 2=second, -1=last
  month_of_year: z.number().min(1).max(12).optional(), // 1-12
  week_days: z.array(z.number().min(0).max(6)).optional(), // For patterns like "weekdays only"
  specific_dates: z.array(z.number().min(1).max(31)).optional(), // For patterns like "1st and 15th"
  pattern: z.string().optional(), // Natural language pattern
});

// Base recurring transaction schema
export const baseRecurringTransactionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  account_id: z.string(),
  category_id: z.string().optional(),
  destination_account_id: z.string().optional(),
  amount: z.number().positive(),
  type: z.enum(["income", "expense", "transfer"]),
  description: z.string().optional(),
  details: z.object({
    payment_medium: z.string().optional(),
    location: z.string().optional(),
    note: z.string().optional(),
    payment_status: z.string().optional(),
  }).optional(),
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "yearly", "custom"]),
  frequency_interval: z.number().min(1).default(1),
  frequency_data: frequencyDataSchema.optional(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().optional(),
  last_generated_date: z.coerce.date().optional(),
  next_due_date: z.coerce.date(),
  auto_post: z.boolean().default(false),
  is_paused: z.boolean().default(false),
  max_occurrences: z.number().positive().optional(),
  occurrences_count: z.number().min(0).default(0),
  template_name: z.string().optional(),
  tags: z.array(z.string()).optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  deleted_at: z.coerce.date().optional(),
});

// Recurring transaction creation schema
export const recurringTransactionCreateSchema = baseRecurringTransactionSchema.omit({
  id: true,
  user_id: true,
  last_generated_date: true,
  next_due_date: true,
  occurrences_count: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});

// Recurring transaction update schema
export const recurringTransactionUpdateSchema = recurringTransactionCreateSchema.extend({
  update_mode: z.enum(["future_only", "next_only", "split_series"]).default("future_only"),
}).partial();

// Recurring instance schema
export const recurringInstanceSchema = z.object({
  due_date: z.coerce.date(),
  amount: z.number(),
  description: z.string().optional(),
  transaction_id: z.string().optional(),
  status: z.enum(["pending", "posted", "skipped", "failed"]),
  is_projected: z.boolean(),
  can_modify: z.boolean(),
});

// Recurring transaction stats schema
export const recurringTransactionStatsSchema = z.object({
  total_count: z.number(),
  active_count: z.number(),
  paused_count: z.number(),
  due_count: z.number(),
});

// Recurring transaction filters schema
export const recurringTransactionFiltersSchema = z.object({
  account_id: z.string().optional(),
  category_id: z.string().optional(),
  frequency: z.string().optional(),
  is_paused: z.boolean().optional(),
  auto_post: z.boolean().optional(),
  template_name: z.string().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
});

// Recurring instances request schema
export const recurringInstancesRequestSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  include_projected: z.boolean().default(true),
});

// Recurring instances response schema
export const recurringInstancesResponseSchema = z.object({
  instances: z.array(recurringInstanceSchema),
  summary: z.object({
    total_count: z.number(),
    pending_count: z.number(),
    posted_count: z.number(),
    skipped_count: z.number(),
    total_amount: z.number(),
  }),
});

// Process recurring transaction schema
export const processRecurringTransactionSchema = z.object({
  action: z.enum(["post", "skip", "modify"]),
  transaction_request: z.object({
    amount: z.number().optional(),
    description: z.string().optional(),
    category_id: z.string().optional(),
    transaction_datetime: z.coerce.date().optional(),
  }).optional(),
});

// Type exports
export type FrequencyData = z.infer<typeof frequencyDataSchema>;
export type RecurringTransaction = z.infer<typeof baseRecurringTransactionSchema>;
export type RecurringTransactionCreate = z.infer<typeof recurringTransactionCreateSchema>;
export type RecurringTransactionUpdate = z.infer<typeof recurringTransactionUpdateSchema>;
export type RecurringInstance = z.infer<typeof recurringInstanceSchema>;
export type RecurringTransactionStats = z.infer<typeof recurringTransactionStatsSchema>;
export type RecurringTransactionFilters = z.infer<typeof recurringTransactionFiltersSchema>;
export type RecurringInstancesRequest = z.infer<typeof recurringInstancesRequestSchema>;
export type RecurringInstancesResponse = z.infer<typeof recurringInstancesResponseSchema>;
export type ProcessRecurringTransaction = z.infer<typeof processRecurringTransactionSchema>;

// Common frequency options for UI
export const frequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom" },
] as const;

// Common custom frequency patterns
export const customFrequencyPatterns = [
  { value: "first_monday", label: "First Monday of the month" },
  { value: "last_weekday", label: "Last weekday of the month" },
  { value: "first_and_fifteenth", label: "1st and 15th of the month" },
  { value: "last_day", label: "Last day of the month" },
  { value: "weekdays_only", label: "Weekdays only" },
] as const;

// Status color mapping for UI
export const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  posted: "bg-green-100 text-green-800",
  skipped: "bg-gray-100 text-gray-800",
  failed: "bg-red-100 text-red-800",
} as const;

// Frequency description helpers
export const getFrequencyDescription = (
  frequency: string,
  interval: number,
  frequencyData?: FrequencyData
): string => {
  switch (frequency) {
    case "daily":
      return interval === 1 ? "Daily" : `Every ${interval} days`;
    case "weekly":
      return interval === 1 ? "Weekly" : `Every ${interval} weeks`;
    case "biweekly":
      return "Bi-weekly";
    case "monthly":
      return interval === 1 ? "Monthly" : `Every ${interval} months`;
    case "yearly":
      return interval === 1 ? "Yearly" : `Every ${interval} years`;
    case "custom":
      if (frequencyData?.pattern) {
        return frequencyData.pattern;
      }
      return "Custom frequency";
    default:
      return "Unknown frequency";
  }
};