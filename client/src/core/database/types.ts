/**
 * Database Types - Local-First Database
 * 
 * Common types and utilities for database operations.
 */

export type DatabaseRecord = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};

export type UserRecord = DatabaseRecord & {
  createdBy?: string | null;
  updatedBy?: string | null;
};

// Query parameters for filtering and pagination
export interface QueryParams {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

// Database operation results
export interface QueryResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

// Common database utilities
export const generateId = (): string => {
  // Simple UUID v4 generator for browser compatibility
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const createTimestamp = (): Date => new Date();

export const softDelete = (record: any): any => ({
  ...record,
  deletedAt: createTimestamp(),
  updatedAt: createTimestamp(),
});

export const updateTimestamp = (record: any): any => ({
  ...record,
  updatedAt: createTimestamp(),
});