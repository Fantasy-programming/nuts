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

export const accountCreateSchema = accountSchema.omit({
  id: true,
  updated_at: true,
});

export type Account = z.infer<typeof accountSchema>;
export type AccountCreate = z.infer<typeof accountCreateSchema>;
