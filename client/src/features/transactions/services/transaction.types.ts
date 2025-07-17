import { z } from "zod";
import { categorySchema } from "@/features/categories/services/category.types";
import { accountSchema } from "@/features/accounts/services/account.types";


const recordDetailsSchema = z.object({
  payment_medium: z.string().optional(),
  location: z.string().optional(),
  note: z.string().optional(),
  payment_status: z.string().optional(),
});

const baseRecordSchema = z.object({
  id: z.string(),
  amount: z.coerce.number(),
  transaction_datetime: z.coerce.date(),
  description: z.string().min(1, "Description is required"),
  category_id: z.string().min(1, "Category is required").optional(),
  account_id: z.string().min(1, "Account is required"),
  details: recordDetailsSchema.optional(),
  updated_at: z.coerce.date(),
  is_external: z.boolean(),
  is_recurring: z.boolean().optional(),
  transaction_currency: z.string(),
  original_amount: z.number(),
});

const baseExtendedRecordSchema = z.object({
  id: z.string(),
  amount: z.coerce.number(),
  transaction_datetime: z.coerce.date(),
  description: z.string().min(1, "Description is required"),
  category: categorySchema.optional(),
  account: accountSchema,
  details: recordDetailsSchema.optional(),
  updated_at: z.coerce.date(),
  is_external: z.boolean(),
  is_recurring: z.boolean().optional(),
  transaction_currency: z.string(),
  original_amount: z.number(),
});

const recordStandardSchema = baseRecordSchema.extend({
  type: z.enum(["expense", "income"]),
});

const recordTransferSchema = baseRecordSchema.extend({
  type: z.literal("transfer"),
  destination_account_id: z.string().min(1, "Destination account is required"),
});

const extendedRecordStandardSchema = baseExtendedRecordSchema.extend({
  type: z.enum(["expense", "income"]),
});

const extendedRecordTransferSchema = baseExtendedRecordSchema.extend({
  type: z.literal("transfer"),
  destination_account: accountSchema,
});


export const recordSchema = z.discriminatedUnion("type", [recordTransferSchema, recordStandardSchema]);
export const extendedRecordSchema = z.discriminatedUnion("type", [extendedRecordTransferSchema, extendedRecordStandardSchema]);

export const recordsSchema = recordSchema.array();
export const extendedRecordsSchema = extendedRecordSchema.array();

export const tableRecordSchema = z
  .discriminatedUnion("type", [
    extendedRecordTransferSchema
      .omit({
        details: true,
        updated_at: true,
        transaction_currency: true,
        original_amount: true,
      }),

    extendedRecordStandardSchema.omit({
      details: true,
      updated_at: true,
      transaction_currency: true,
      original_amount: true,
    })
  ])
  .transform((record) => ({
    ...record,
    amount: record.type === "expense" && record.amount > 0 ? -record.amount : record.amount,
  }));

export const tableRecordsSchema = z.object({
  id: z.string(),
  date: z.coerce.date(),
  total: z.number(),
  transactions: tableRecordSchema.array(),
});

export const tableRecordsArraySchema = tableRecordsSchema.array();

export const paginationSchema = z.object({
  total_items: z.number(),
  total_pages: z.number(),
  page: z.number(),
  limit: z.number(),
});


export const transactionsResponseSchema = z.object({
  data: tableRecordsArraySchema,
  pagination: paginationSchema,
});


export const recordCreateSchema = z
  .discriminatedUnion("type", [
    recordTransferSchema
      .omit({
        id: true,
        is_external: true,
        updated_at: true,
        transaction_currency: true,
        original_amount: true,
      }),

    recordStandardSchema.omit({
      id: true,
      is_external: true,
      updated_at: true,
      transaction_currency: true,
      original_amount: true,
    })
  ])
  .transform((record) => ({
    ...record,
    amount: record.type === "expense" && record.amount > 0 ? -record.amount : record.amount,
  }));


export const recordUpdateSchema = z
  .discriminatedUnion("type", [
    recordTransferSchema
      .omit({
        id: true,
        is_external: true,
        updated_at: true,
        transaction_currency: true,
        original_amount: true,
      }),

    recordStandardSchema.omit({
      id: true,
      is_external: true,
      updated_at: true,
      transaction_currency: true,
      original_amount: true,
    })
  ])
  .transform((record) => ({
    ...record,
    amount: record.type === "expense" && record.amount > 0 ? -record.amount : record.amount,
  }));

export type RecordSchema = z.infer<typeof recordSchema>;
export type ExtendedRecordSchema = z.infer<typeof extendedRecordSchema>;
export type TableRecordSchema = z.infer<typeof tableRecordSchema>;
export type TableRecordsSchema = z.infer<typeof tableRecordsSchema>;
export type TableRecordsArraySchema = z.infer<typeof tableRecordsArraySchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type TransactionsResponse = z.infer<typeof transactionsResponseSchema>;

export type RecordCreateSchema = z.infer<typeof recordCreateSchema>;
export type RecordUpdateSchema = z.infer<typeof recordUpdateSchema>;
export type RecordsSubmit = (values: RecordCreateSchema) => void;
