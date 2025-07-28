/**
 * Preferences Schema - Local-First Database
 * 
 * Mirrors the backend PostgreSQL preferences table for local storage.
 * Includes user preferences and settings.
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { currencies } from './currencies';

// Theme enum
export const themeTypes = [
  'light',
  'dark'
] as const;

export type ThemeType = typeof themeTypes[number];

// Time format enum
export const timeFormatTypes = [
  '12h',
  '24h'
] as const;

export type TimeFormatType = typeof timeFormatTypes[number];

// Date format enum
export const dateFormatTypes = [
  'dd/mm/yyyy',
  'mm/dd/yyyy', 
  'yyyy/mm/dd'
] as const;

export type DateFormatType = typeof dateFormatTypes[number];

export const preferences = sqliteTable('preferences', {
  id: text('id').primaryKey(), // UUID as text in SQLite
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  locale: text('locale', { length: 10 }).notNull().default('en'),
  theme: text('theme', { length: 10 }).notNull().default('light').$type<ThemeType>(),
  currency: text('currency', { length: 3 }).notNull().default('USD').references(() => currencies.code),
  
  // Extended preferences (added in migration 00010)
  timezone: text('timezone', { length: 50 }).notNull().default('UTC'),
  timeFormat: text('time_format', { length: 5 }).notNull().default('24h').$type<TimeFormatType>(),
  dateFormat: text('date_format', { length: 10 }).notNull().default('dd/mm/yyyy').$type<DateFormatType>(),
  startWeekOnMonday: integer('start_week_on_monday', { mode: 'boolean' }).notNull().default(true),
  darkSidebar: integer('dark_sidebar', { mode: 'boolean' }).notNull().default(false),
  
  // Audit fields
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export type Preference = typeof preferences.$inferSelect;
export type NewPreference = typeof preferences.$inferInsert;