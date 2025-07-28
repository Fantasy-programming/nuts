/**
 * Transaction Schema - Local-First Database
 * 
 * Mirrors the backend PostgreSQL transactions table for local storage.
 * Includes all transaction types and external provider fields.
 */

import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { accounts } from './accounts';
import { categories } from './categories';

// Transaction type enum
export const transactionTypes = [
  'transfer',
  'income', 
  'expense'
] as const;

export type TransactionType = typeof transactionTypes[number];

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(), // UUID as text in SQLite
  amount: real('amount').notNull(), // NUMERIC -> real in SQLite
  type: text('type').notNull().$type<TransactionType>(),
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').notNull().references(() => categories.id),
  destinationAccountId: text('destination_account_id').references(() => accounts.id, { onDelete: 'set null' }),
  transactionDatetime: integer('transaction_datetime', { mode: 'timestamp' }).notNull(),
  description: text('description'),
  details: text('details', { mode: 'json' }), // JSONB -> JSON text in SQLite
  
  // External provider fields (added in migration 20250603234337)
  isExternal: integer('is_external', { mode: 'boolean' }).notNull().default(false),
  providerTransactionId: text('provider_transaction_id', { length: 255 }),
  
  // Audit fields
  createdBy: text('created_by').references(() => users.id),
  updatedBy: text('updated_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;