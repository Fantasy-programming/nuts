/**
 * Category Schema - Local-First Database
 * 
 * Mirrors the backend PostgreSQL categories table for local storage.
 * Includes hierarchical structure and customization fields.
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const categories: any = sqliteTable('categories', {
  id: text('id').primaryKey(), // UUID as text in SQLite
  name: text('name', { length: 100 }).notNull(),
  parentId: text('parent_id').references((): any => categories.id, { onDelete: 'set null' }),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  
  // Customization fields (added in migration 20250626030843)
  color: text('color', { length: 7 }), // Hex color code like #FF5733
  icon: text('icon', { length: 100 }).notNull().default('Box'), // Icon name
  
  // Audit fields
  createdBy: text('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  updatedBy: text('updated_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;