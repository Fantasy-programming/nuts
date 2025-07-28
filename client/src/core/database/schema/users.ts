/**
 * User Schema - Local-First Database
 * 
 * Mirrors the backend PostgreSQL users table for local storage.
 * Uses SQLite compatible types and structure.
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // UUID as text in SQLite
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  password: text('password').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;