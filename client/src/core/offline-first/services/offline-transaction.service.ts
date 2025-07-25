/**
 * Offline-First Transaction Service
 * 
 * Provides the same API as the server-based transaction service but operates
 * on local CRDT data. This service can be swapped in place of the server
 * service using feature flags.
 */

import { crdtService } from './crdt.service';
import { sqliteIndexService } from './sqlite-index.service';
import { CRDTTransaction } from '../types/crdt-schema';
import { RecordCreateSchema, RecordUpdateSchema, RecordSchema, TransactionsResponse } from '@/features/transactions/services/transaction.types';
import type { GetTransactionsParams } from '@/features/transactions/services/transaction';
import { v4 as uuidv4 } from 'uuid';

class OfflineFirstTransactionService {
  private isInitialized = false;

  /**
   * Initialize the offline-first transaction service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await crdtService.initialize();
      await sqliteIndexService.initialize();

      // Rebuild SQLite indices from CRDT data
      const transactions = crdtService.getTransactions();
      const accounts = crdtService.getAccounts();
      const categories = crdtService.getCategories();

      await sqliteIndexService.rebuildIndices(transactions, accounts, categories);

      this.isInitialized = true;
      console.log('Offline-first transaction service initialized');
    } catch (error) {
      console.error('Failed to initialize offline-first transaction service:', error);
      throw error;
    }
  }

  /**
   * Get transactions with filtering and pagination
   * Mirrors the API of the server-based getTransactions function
   */
  async getTransactions(params: GetTransactionsParams): Promise<TransactionsResponse> {
    await this.ensureInitialized();

    try {
      const {
        page = 1,
        limit = 25,
        q: search,
        account_id: accountId,
        category_id: categoryId,
        type,
        start_date: startDate,
        end_date: endDate,
        currency
      } = params;

      // Query SQLite index for efficient filtering
      const result = sqliteIndexService.queryTransactions({
        page,
        limit,
        search,
        accountId,
        categoryId,
        type,
        startDate,
        endDate,
        currency
      });

      // Group transactions by date
      const groupedData: Record<string, any> = {};

      result.transactions.forEach((tx) => {
        const date = tx.date_only || tx.transaction_datetime.split('T')[0];

        if (!groupedData[date]) {
          groupedData[date] = {
            id: date,
            date: new Date(date),
            total: 0,
            transactions: []
          };
        }

        // Convert back to expected format
        const transaction = this.convertFromCRDTFormat(tx);
        groupedData[date].transactions.push(transaction);
        groupedData[date].total += transaction.amount;
      });

      // Convert to array and sort by date
      const data = Object.values(groupedData).sort((a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      console.log(data)

      return {
        data,
        pagination: {
          total_items: result.totalCount,
          total_pages: result.totalPages,
          page,
          limit
        }
      };
    } catch (error) {
      console.error('Failed to get transactions:', error);
      throw error;
    }
  }

  /**
   * Get a single transaction by ID
   */
  async getTransaction(id: string): Promise<RecordSchema> {
    await this.ensureInitialized();

    const transaction = crdtService.getTransaction(id);
    if (!transaction) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    return this.convertFromCRDTFormat(transaction);
  }

  /**
   * Create a new transaction
   */
  async createTransaction(transaction: RecordCreateSchema): Promise<RecordSchema[]> {
    await this.ensureInitialized();

    try {
      const id = uuidv4();
      const crdtTransaction = this.convertToCRDTFormat({
        ...transaction,
        id,
        is_external: false,
        transaction_currency: 'USD', // Default currency since it's not in RecordCreateSchema
        original_amount: Math.abs(transaction.amount)
      });

      await crdtService.createTransaction(crdtTransaction as any);

      // Update SQLite indices
      await this.rebuildIndices();

      const created = await this.getTransaction(id);
      return [created];
    } catch (error) {
      console.error('Failed to create transaction:', error);
      throw error;
    }
  }

  /**
   * Update an existing transaction
   */
  async updateTransaction(id: string, updates: RecordUpdateSchema): Promise<RecordSchema> {
    await this.ensureInitialized();

    try {
      const crdtUpdates = this.convertToCRDTFormat(updates);
      await crdtService.updateTransaction(id, crdtUpdates);

      // Update SQLite indices
      await this.rebuildIndices();

      return await this.getTransaction(id);
    } catch (error) {
      console.error('Failed to update transaction:', error);
      throw error;
    }
  }

  /**
   * Delete transactions
   */
  async deleteTransactions(ids: string[] | string): Promise<void> {
    await this.ensureInitialized();

    try {
      const transactionIds = Array.isArray(ids) ? ids : [ids];

      for (const id of transactionIds) {
        await crdtService.deleteTransaction(id);
      }

      // Update SQLite indices
      await this.rebuildIndices();
    } catch (error) {
      console.error('Failed to delete transactions:', error);
      throw error;
    }
  }

  /**
   * Bulk delete transactions
   */
  async bulkDeleteTransactions(transactionIds: string[]): Promise<void> {
    return this.deleteTransactions(transactionIds);
  }

  /**
   * Bulk update categories
   */
  async bulkUpdateCategories(transactionIds: string[], categoryId: string): Promise<void> {
    await this.ensureInitialized();

    try {
      for (const id of transactionIds) {
        await crdtService.updateTransaction(id, { category_id: categoryId });
      }

      // Update SQLite indices
      await this.rebuildIndices();
    } catch (error) {
      console.error('Failed to bulk update categories:', error);
      throw error;
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
    await this.ensureInitialized();

    try {
      const updates: Partial<CRDTTransaction> = {};

      if (params.categoryId) updates.category_id = params.categoryId;
      if (params.accountId) updates.account_id = params.accountId;
      if (params.transactionDatetime) {
        updates.transaction_datetime = params.transactionDatetime.toISOString();
      }

      for (const id of params.transactionIds) {
        await crdtService.updateTransaction(id, updates);
      }

      // Update SQLite indices
      await this.rebuildIndices();
    } catch (error) {
      console.error('Failed to bulk update manual transactions:', error);
      throw error;
    }
  }

  /**
   * Convert CRDT transaction format to expected API format
   */
  private convertFromCRDTFormat(crdtTx: any): RecordSchema {
    return {
      id: crdtTx.id,
      amount: crdtTx.amount,
      transaction_datetime: new Date(crdtTx.transaction_datetime),
      description: crdtTx.description,
      category_id: crdtTx.category_id,
      account_id: crdtTx.account_id,
      type: crdtTx.type,
      destination_account_id: crdtTx.destination_account_id,
      details: crdtTx.details,
      updated_at: new Date(crdtTx.updated_at),
      is_external: crdtTx.is_external,
      transaction_currency: crdtTx.transaction_currency,
      original_amount: crdtTx.original_amount,
      // Add account and category info if available from SQL query
      ...(crdtTx.account_name && {
        account: {
          id: crdtTx.account_id,
          name: crdtTx.account_name,
          currency: crdtTx.account_currency
        }
      }),
      ...(crdtTx.category_name && {
        category: {
          id: crdtTx.category_id,
          name: crdtTx.category_name,
          color: crdtTx.category_color
        }
      })
    } as RecordSchema;
  }

  /**
   * Convert API format to CRDT transaction format
   */
  private convertToCRDTFormat(tx: any): Partial<CRDTTransaction> {
    return {
      id: tx.id,
      amount: tx.amount,
      transaction_datetime: tx.transaction_datetime instanceof Date
        ? tx.transaction_datetime.toISOString()
        : tx.transaction_datetime,
      description: tx.description,
      category_id: tx.category_id,
      account_id: tx.account_id,
      type: tx.type,
      destination_account_id: tx.destination_account_id,
      details: tx.details,
      transaction_currency: tx.transaction_currency,
      original_amount: tx.original_amount,
      is_external: tx.is_external,
    };
  }

  /**
   * Rebuild SQLite indices from CRDT data
   */
  private async rebuildIndices(): Promise<void> {
    const transactions = crdtService.getTransactions();
    const accounts = crdtService.getAccounts();
    const categories = crdtService.getCategories();

    await sqliteIndexService.rebuildIndices(transactions, accounts, categories);
  }

  /**
   * Ensure the service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
}

// Export singleton instance
export const offlineFirstTransactionService = new OfflineFirstTransactionService();
