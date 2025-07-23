/**
 * CRDT Document Schema for Offline-First Architecture
 * 
 * This defines the Automerge document structure that mirrors the current
 * transaction data model for conflict-free replication.
 */

import { z } from "zod";

// Base CRDT document structure
export const crdtDocumentSchema = z.object({
  // Document metadata
  version: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  user_id: z.string(),
  
  // Core data collections
  transactions: z.record(z.string(), z.any()), // Transaction ID -> Transaction
  accounts: z.record(z.string(), z.any()),     // Account ID -> Account
  categories: z.record(z.string(), z.any()),   // Category ID -> Category
  rules: z.record(z.string(), z.any()),        // Rule ID -> Rule
  
  // Index metadata for SQLite
  indices: z.object({
    last_rebuilt: z.string().optional(),
    version: z.number(),
  }),
});

// CRDT Transaction schema - mirrors the existing transaction schema
export const crdtTransactionSchema = z.object({
  id: z.string(),
  amount: z.number(),
  transaction_datetime: z.string(), // ISO string for CRDT compatibility
  description: z.string(),
  category_id: z.string().optional(),
  account_id: z.string(),
  type: z.enum(["expense", "income", "transfer"]),
  destination_account_id: z.string().optional(), // For transfers
  details: z.object({
    payment_medium: z.string().optional(),
    location: z.string().optional(),
    note: z.string().optional(),
    payment_status: z.string().optional(),
  }).optional(),
  transaction_currency: z.string(),
  original_amount: z.number(),
  is_external: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().optional(), // Soft delete for CRDT
});

// CRDT Account schema
export const crdtAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  currency: z.string(),
  balance: z.number(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().optional(),
});

// CRDT Category schema
export const crdtCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  icon: z.string().optional(),
  parent_id: z.string().optional(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().optional(),
});

// Export types
export type CRDTDocument = z.infer<typeof crdtDocumentSchema>;
export type CRDTTransaction = z.infer<typeof crdtTransactionSchema>;
export type CRDTAccount = z.infer<typeof crdtAccountSchema>;
export type CRDTCategory = z.infer<typeof crdtCategorySchema>;

// Utility type for CRDT operations
export interface CRDTOperation {
  type: 'create' | 'update' | 'delete';
  collection: 'transactions' | 'accounts' | 'categories' | 'rules';
  id: string;
  data?: any;
  timestamp: string;
}