/**
 * Database Module - Local-First Database Infrastructure
 * 
 * This module provides the complete database schema and infrastructure
 * for the local-first offline application. It mirrors the backend
 * PostgreSQL schema but uses SQLite for browser compatibility.
 */

export * from './schema';
export * from './client';
export * from './types';

// Main exports for easy access
export { localDb } from './client';
export { schema } from './schema';