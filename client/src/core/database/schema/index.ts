/**
 * Database Schema - Local-First Database
 * 
 * Central export for all database tables and types.
 * Mirrors the backend PostgreSQL schema for offline-first functionality.
 */

// Table schemas
export * from './users';
export * from './currencies';
export * from './accounts';
export * from './categories';
export * from './transactions';
export * from './preferences';
export * from './tags';

// Re-export all tables for Drizzle operations
import { users } from './users';
import { currencies } from './currencies';
import { accounts } from './accounts';
import { categories } from './categories';
import { transactions } from './transactions';
import { preferences } from './preferences';
import { tags } from './tags';

export const schema = {
  users,
  currencies,
  accounts,
  categories,
  transactions,
  preferences,
  tags,
};