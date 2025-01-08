import * as z from "zod";

const recordDetailsSchema = z.object({
  payment_medium: z.string().optional(),
  location: z.string().optional(),
  note: z.string().optional(),
  payment_status: z.string().optional(),
})

const baseRecordSchema = z.object({
  id: z.string(),
  amount: z.number(),
  transaction_datetime: z.coerce.date(),
  description: z.string().min(1, "Description is required"),
  category_id: z.string().min(1, "Category is required"),
  account_id: z.string().min(1, "Account is required"),
  details: recordDetailsSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
})

const recordTransferSchema = baseRecordSchema.extend({
  type: z.literal("transfer"),
  destinationAccountId: z.string().min(1, "Destination account is required"),
});

const recordStandardSchema = baseRecordSchema.extend({
  type: z.enum(["expense", "income"]),
});

const createOmits = {
  id: true,
  created_at: true,
  updated_at: true
} as const;

export const recordSchema = z.discriminatedUnion("type", [
  recordTransferSchema,
  recordStandardSchema,
]);

export const recordsSchema = recordSchema.array()

export const recordCreateSchema = z.discriminatedUnion("type", [
  recordTransferSchema.omit(createOmits),
  recordStandardSchema.omit(createOmits),
]).transform((record) => ({
  ...record,
  amount: record.type !== "income" && record.amount > 0 ? -record.amount : record.amount,
}));

export type RecordSchema = z.infer<typeof recordSchema>
export type RecordCreateSchema = z.infer<typeof recordCreateSchema>
export type RecordsSubmit = (values: RecordCreateSchema) => void
