import * as z from "zod";

export const accountFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  balance: z.number().min(0, "Balance must be positive"),
  currency: z.string().min(1, "Currency is required"),
  color: z.enum(["red", "green", "blue"], {
    required_error: "Please select a color",
  }),
  type: z.enum(["cash", "savings", "investment", "credit"]),
});

export type AccountSchema = z.infer<typeof accountFormSchema>
export type AccountSubmit = (values: AccountSchema) => void
