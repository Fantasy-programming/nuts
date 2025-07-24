/**
 * Adaptive Transaction Service
 * 
 * This service acts as a proxy that routes requests to either the server-based
 * transaction service or the offline-first service based on feature flags.
 * This allows for seamless switching between implementations during migration.
 */

import { featureFlagsService } from './feature-flags.service';
import { connectivityService } from './connectivity.service';
import { offlineFirstTransactionService } from './offline-transaction.service';
import * as serverTransactionService from '@/features/transactions/services/transaction';
import { RecordCreateSchema, RecordUpdateSchema, RecordSchema, TransactionsResponse } from '@/features/transactions/services/transaction.types';

// Import GetTransactionsParams from the service file where it's defined
import type { GetTransactionsParams } from '@/features/transactions/services/transaction';

class AdaptiveTransactionService {
  /**
   * Determine if we should use offline-first based on feature flags and connectivity
   */
  private shouldUseOfflineFirst(): boolean {
    try {
      // If fully offline mode is enabled, always use offline
      if (featureFlagsService?.isFullyOfflineModeEnabled?.()) {
        return true;
      }

      // If offline-first is disabled, never use offline
      if (!featureFlagsService?.useOfflineFirstTransactions?.()) {
        return false;
      }

      // If we're in fully offline mode (no server access), use offline
      if (connectivityService?.isFullyOffline?.() || !connectivityService?.hasServerAccess?.()) {
        return true;
      }

      // Default to offline-first when feature flag is enabled and we have connectivity
      return true;
    } catch (error) {
      console.warn('Error in shouldUseOfflineFirst, defaulting to false:', error);
      return false;
    }
  }
  /**
   * Get transactions using the appropriate service based on feature flags
   */
  async getTransactions(params: GetTransactionsParams): Promise<TransactionsResponse> {
    if (this.shouldUseOfflineFirst()) {
      return offlineFirstTransactionService.getTransactions(params);
    } else {
      return serverTransactionService.getTransactions(params);
    }
  }
  
  /**
   * Get a single transaction
   */
  async getTransaction(id: string): Promise<RecordSchema> {
    if (this.shouldUseOfflineFirst()) {
      return offlineFirstTransactionService.getTransaction(id);
    } else {
      return serverTransactionService.getTransaction(id);
    }
  }
  
  /**
   * Create a new transaction
   */
  async createTransaction(transaction: RecordCreateSchema): Promise<RecordSchema[]> {
    if (this.shouldUseOfflineFirst()) {
      return offlineFirstTransactionService.createTransaction(transaction);
    } else {
      return serverTransactionService.createTransaction(transaction);
    }
  }
  
  /**
   * Update an existing transaction
   */
  async updateTransaction(id: string, updates: RecordUpdateSchema): Promise<RecordSchema> {
    if (this.shouldUseOfflineFirst()) {
      return offlineFirstTransactionService.updateTransaction(id, updates);
    } else {
      return serverTransactionService.updateTransaction(id, updates);
    }
  }
  
  /**
   * Delete transactions
   */
  async deleteTransactions(ids: string[] | string): Promise<void> {
    if (this.shouldUseOfflineFirst()) {
      return offlineFirstTransactionService.deleteTransactions(ids);
    } else {
      return serverTransactionService.deleteTransactions(ids);
    }
  }
  
  /**
   * Bulk delete transactions
   */
  async bulkDeleteTransactions(transactionIds: string[]): Promise<void> {
    if (this.shouldUseOfflineFirst()) {
      return offlineFirstTransactionService.bulkDeleteTransactions(transactionIds);
    } else {
      return serverTransactionService.bulkDeleteTransactions(transactionIds);
    }
  }
  
  /**
   * Bulk update categories
   */
  async bulkUpdateCategories(transactionIds: string[], categoryId: string): Promise<void> {
    if (this.shouldUseOfflineFirst()) {
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
    if (this.shouldUseOfflineFirst()) {
      return offlineFirstTransactionService.bulkUpdateManualTransactions(params);
    } else {
      return serverTransactionService.bulkUpdateManualTransactions(params);
    }
  }
  
  /**
   * Initialize the appropriate service
   */
  async initialize(): Promise<void> {
    if (this.shouldUseOfflineFirst()) {
      await offlineFirstTransactionService.initialize();
      console.log('✅ Adaptive transaction service initialized with offline-first mode');
    } else {
      console.log('✅ Adaptive transaction service initialized with server mode');
    }
  }

  /**
   * Check if the service is using offline-first mode
   */
  isUsingOfflineFirst(): boolean {
    return this.shouldUseOfflineFirst();
  }
}

// Export singleton instance
export const adaptiveTransactionService = new AdaptiveTransactionService();