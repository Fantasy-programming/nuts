import z from "zod";

const accountType = z.enum(["cash", "savings", "investment", "credit", "checking"], { message: "Invalid account type" })

export const accountSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  type: accountType,
  meta: z.object({
    notes: z.string().optional(),
    institution: z.string().optional(),
    institution_name: z.string().optional(),
    logo: z.string().optional(),
  }).optional().nullable(),
  balance: z.number(),
  is_external: z.boolean(),
  currency: z.string().min(1, "Currency is required"),
  updated_at: z.string(),
});

export const accountWTrendSchema = accountSchema.extend({
  trend: z.number(),
  balance_timeseries: z.array(z.object({
    date: z.coerce.date(),
    balance: z.number()
  }))
})

export const accountBalanceTimelineSchema = z.object({
  balance: z.number(),
  month: z.coerce.date()
})

export const accountCreateSchema = accountSchema.omit({
  id: true,
  updated_at: true,
  is_external: true
});

export const accountFormSchema = accountSchema.omit({
  id: true,
  updated_at: true,
  is_external: true
  // meta: true,
})


export const groupedAccountSchema = z.object({
  type: accountType,
  total: z.number(),
  trend: z.number(),
  accounts: z.array(accountWTrendSchema)
});


export type Account = z.infer<typeof accountSchema>;
export type AccountWTrend = z.infer<typeof accountWTrendSchema>;
export type GroupedAccount = z.infer<typeof groupedAccountSchema>;
export type AccountBalanceTimeline = z.infer<typeof accountBalanceTimelineSchema>;
export type AccountCreate = z.infer<typeof accountCreateSchema>;
export type AccountFormSchema = z.infer<typeof accountFormSchema>;
export type AccountSubmit = (values: AccountFormSchema) => void;
export type AccountUpdate = (id: string, values: AccountFormSchema) => void;
export type AccountDelete = (id: string) => void;
