import z from "zod";

export const accountSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["cash", "savings", "investment", "credit"]),
  color: z.string(),
  balance: z.number(),
  currency: z.string().min(1, "Currency is required"),
  updated_at: z.string(),
});

export const accountWTrendSchema = accountSchema.extend({
  transactions: z.object({
    id: z.string(),
    amount: z.coerce.number(),
    type: z.enum(["expense", "income", "transfer"]),
    transaction_datetime: z.coerce.date(),
    description: z.string().min(1, "Description is required"),
  }).array().optional(),
  trend: z.number()
})

export const accountBalanceTimelineSchema = z.object({
  balance: z.number(),
  month: z.coerce.date()
})

export const accountCreateSchema = accountSchema.omit({
  id: true,
  updated_at: true,
});

export const accountFormSchema = accountSchema.omit({
  id: true,
  updated_at: true,
  meta: true,
})

export type Account = z.infer<typeof accountSchema>;
export type AccountWTrend = z.infer<typeof accountWTrendSchema>;
export type AccountBalanceTimeline = z.infer<typeof accountBalanceTimelineSchema>;
export type AccountCreate = z.infer<typeof accountCreateSchema>;
export type AccountFormSchema = z.infer<typeof accountFormSchema>;
export type AccountSubmit = (values: AccountFormSchema) => void;
export type AccountUpdate = (id: string, values: AccountFormSchema) => void;
export type AccountDelete = (id: string) => void;
