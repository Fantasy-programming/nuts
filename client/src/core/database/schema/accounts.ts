/**
 * Account Schema - Local-First Database
 * 
 * Mirrors the backend PostgreSQL accounts table for local storage.
 * Includes all account types and external connection fields.
 */

import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { currencies } from './currencies';

// Account type enum - mirrors backend ACCOUNT_TYPE
export const accountTypes = [
  'cash',
  'momo', 
  'credit',
  'investment',
  'checking',
  'savings',
  'loan',
  'other'
] as const;

export type AccountType = typeof accountTypes[number];

// Color enum - mirrors backend COLOR_ENUM
export const colorTypes = [
  'red',
  'green', 
  'blue'
] as const;

export type ColorType = typeof colorTypes[number];

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(), // UUID as text in SQLite
  name: text('name', { length: 100 }).notNull(),
  type: text('type').notNull().$type<AccountType>(),
  balance: real('balance').notNull().default(0), // DECIMAL(12,2) -> real in SQLite
  currency: text('currency', { length: 3 }).notNull().references(() => currencies.code),
  color: text('color').notNull().default('blue').$type<ColorType>(),
  meta: text('meta', { mode: 'json' }), // JSONB -> JSON text in SQLite
  
  // External account connection fields
  isExternal: integer('is_external', { mode: 'boolean' }).notNull().default(false),
  providerAccountId: text('provider_account_id', { length: 255 }),
  providerName: text('provider_name', { length: 50 }),
  syncStatus: text('sync_status', { length: 50 }),
  lastSyncedAt: integer('last_synced_at', { mode: 'timestamp' }),
  connectionId: text('connection_id'), // FK to user_financial_connections
  
  // Audit fields
  createdBy: text('created_by').references(() => users.id, { onDelete: 'cascade' }),
  updatedBy: text('updated_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;