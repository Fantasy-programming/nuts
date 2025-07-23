/**
 * Adaptive Transaction Service
 * 
 * This service acts as a proxy that routes requests to either the server-based
 * transaction service or the offline-first service based on feature flags.
 * This allows for seamless switching between implementations during migration.
 */

import { featureFlagsService } from './feature-flags.service';
import { offlineFirstTransactionService } from './offline-transaction.service';
import * as serverTransactionService from '@/features/transactions/services/transaction';
import { RecordCreateSchema, RecordUpdateSchema, RecordSchema, TransactionsResponse } from '@/features/transactions/services/transaction.types';

// Import GetTransactionsParams from the service file where it's defined
import type { GetTransactionsParams } from '@/features/transactions/services/transaction';

class AdaptiveTransactionService {
  /**
   * Get transactions using the appropriate service based on feature flags
   */
  async getTransactions(params: GetTransactionsParams): Promise<TransactionsResponse> {
    if (featureFlagsService.useOfflineFirstTransactions()) {
      return offlineFirstTransactionService.getTransactions(params);
    } else {
      return serverTransactionService.getTransactions(params);
    }
  }
  
  /**
   * Get a single transaction
   */
  async getTransaction(id: string): Promise<RecordSchema> {
    if (featureFlagsService.useOfflineFirstTransactions()) {
      return offlineFirstTransactionService.getTransaction(id);
    } else {
      return serverTransactionService.getTransaction(id);
    }
  }
  
  /**
   * Create a new transaction
   */
  async createTransaction(transaction: RecordCreateSchema): Promise<RecordSchema[]> {
    if (featureFlagsService.useOfflineFirstTransactions()) {
      return offlineFirstTransactionService.createTransaction(transaction);
    } else {
      return serverTransactionService.createTransaction(transaction);
    }
  }
  
  /**
   * Update an existing transaction
   */
  async updateTransaction(id: string, updates: RecordUpdateSchema): Promise<RecordSchema> {
    if (featureFlagsService.useOfflineFirstTransactions()) {
      return offlineFirstTransactionService.updateTransaction(id, updates);
    } else {
      return serverTransactionService.updateTransaction(id, updates);
    }
  }
  
  /**
   * Delete transactions
   */
  async deleteTransactions(ids: string[] | string): Promise<void> {
    if (featureFlagsService.useOfflineFirstTransactions()) {
      return offlineFirstTransactionService.deleteTransactions(ids);
    } else {
      return serverTransactionService.deleteTransactions(ids);
    }
  }
  
  /**
   * Bulk delete transactions
   */
  async bulkDeleteTransactions(transactionIds: string[]): Promise<void> {
    if (featureFlagsService.useOfflineFirstTransactions()) {
      return offlineFirstTransactionService.bulkDeleteTransactions(transactionIds);
    } else {
      return serverTransactionService.bulkDeleteTransactions(transactionIds);
    }
  }
  
  /**
   * Bulk update categories
   */
  async bulkUpdateCategories(transactionIds: string[], categoryId: string): Promise<void> {
    if (featureFlagsService.useOfflineFirstTransactions()) {
      return offlineFirstTransactionService.bulkUpdateCategories(transactionIds, categoryId);
    } else {
      return serverTransactionService.bulkUpdateCategories(transactionIds, categoryId);
    }
  }
  
  /**
   * Bulk update manual transactions
   */
  async bulkUpdateManualTransactions(params: {
    transactionIds: string[];
    categoryId?: string;
    accountId?: string;
    transactionDatetime?: Date;
  }): Promise<void> {
    if (featureFlagsService.useOfflineFirstTransactions()) {
      return offlineFirstTransactionService.bulkUpdateManualTransactions(params);
    } else {
      return serverTransactionService.bulkUpdateManualTransactions(params);
    }
  }
  
  /**
   * Initialize the appropriate service
   */
  async initialize(): Promise<void> {
    if (featureFlagsService.useOfflineFirstTransactions()) {
      await offlineFirstTransactionService.initialize();
    }
    // Server service doesn't need initialization
  }
}

// Export singleton instance
export const adaptiveTransactionService = new AdaptiveTransactionService();