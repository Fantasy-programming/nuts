/**
 * Tags Schema - Local-First Database
 * 
 * Mirrors the backend PostgreSQL tags table for local storage.
 * Includes user-defined tags with colors.
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { type ColorType } from './accounts';

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(), // UUID as text in SQLite
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name', { length: 100 }).notNull(),
  color: text('color').notNull().default('blue').$type<ColorType>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;