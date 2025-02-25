import * as z from "zod";
import { categorySchema } from "@/features/categories/services/category.types";
import { accountSchema } from "@/features/accounts/services/account.types";


const recordDetailsSchema = z.object({
  payment_medium: z.string().optional(),
  location: z.string().optional(),
  note: z.string().optional(),
  payment_status: z.string().optional(),
})

const baseRecordSchema = z.object({
  id: z.string(),
  amount: z.coerce.number(),
  transaction_datetime: z.coerce.date(),
  description: z.string().min(1, "Description is required"),
  category: categorySchema,
  account: accountSchema,
  details: recordDetailsSchema.optional(),
  updated_at: z.coerce.date()
})

const recordTransferSchema = baseRecordSchema.extend({
  type: z.literal("transfer"),
  destination_account: accountSchema,
});

const recordStandardSchema = baseRecordSchema.extend({
  type: z.enum(["expense", "income"]),
});

const createOmits = {
  id: true,
  updated_at: true
} as const;

export const recordSchema = z.discriminatedUnion("type", [
  recordTransferSchema,
  recordStandardSchema,
]);

export const recordsSchema = recordSchema.array()

export const grouppedRecordsSchema = z.object({
  id: z.string(),
  date: z.coerce.date(),
  total: z.number(),
  transactions: recordsSchema
})

export const grouppedRecordsArraySchema = grouppedRecordsSchema.array()

export const recordCreateSchema = z.discriminatedUnion("type", [
  recordTransferSchema.omit({
    ...createOmits,
    category: true,
    account: true,
    destination_account: true
  }).extend({
    category_id: z.string().min(1, "Category is required"),
    account_id: z.string().min(1, "Account is required"),
    destination_account_id: z.string().min(1, "Destination account is required"),
  }),
  recordStandardSchema.omit({
    ...createOmits,
    category: true,
    account: true
  }).extend({
    category_id: z.string().min(1, "Category is required"),
    account_id: z.string().min(1, "Account is required"),
  }),
]).transform((record) => ({
  ...record,
  amount: record.type === "expense" && record.amount > 0 ? -record.amount : record.amount,
}));

export type RecordSchema = z.infer<typeof recordSchema>
export type GrouppedRecordsSchema = z.infer<typeof grouppedRecordsSchema>
export type GrouppedRecordsArraySchema = z.infer<typeof grouppedRecordsArraySchema>
export type RecordCreateSchema = z.infer<typeof recordCreateSchema>
export type RecordsSubmit = (values: RecordCreateSchema) => void
