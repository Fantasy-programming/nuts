import z from "zod";

export const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  parent_id: z.string().nullable(),
  is_default: z.boolean().nullable(),
  updated_at: z.string(),
  icon: z.string(),
  color: z.string().nullable(),
});

export const categoryCreateSchema = categorySchema.omit({
  id: true,
  updated_at: true,
});

export type Category = z.infer<typeof categorySchema>;
export type CategoryCreate = z.infer<typeof categoryCreateSchema>;
