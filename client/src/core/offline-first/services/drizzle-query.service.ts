/**
 * Drizzle Query Service - Local-First Database
 * 
 * Replaces the legacy SQLite service with Drizzle ORM for type-safe queries.
 * Provides efficient querying capabilities over CRDT data using Drizzle.
 */

import { eq, and, like, gte, lte, desc, asc, count, isNull } from 'drizzle-orm';
import { localDb, schema } from '../../database';
import { CRDTTransaction, CRDTAccount, CRDTCategory } from '../types/crdt-schema';
import type { GetTransactionsParams } from '@/features/transactions/services/transaction';

class DrizzleQueryService {
  private isInitialized = false;

  /**
   * Initialize the Drizzle query service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await localDb.initialize();
      this.isInitialized = true;
      console.log('Drizzle query service initialized');
    } catch (error) {
      console.error('Failed to initialize Drizzle query service:', error);
      throw error;
    }
  }

  /**
   * Rebuild database from CRDT data
   */
  async rebuildFromCRDT(
    transactions: Record<string, CRDTTransaction>,
    accounts: Record<string, CRDTAccount>,
    categories: Record<string, CRDTCategory>
  ): Promise<void> {
    await this.ensureInitialized();

    try {
      const db = localDb.get();

      // Clear existing data (soft delete or full clear)
      await db.delete(schema.transactions);
      await db.delete(schema.accounts);
      await db.delete(schema.categories);

      // Insert accounts
      if (Object.keys(accounts).length > 0) {
        const accountsData = Object.values(accounts)
          .filter(acc => acc.id && acc.name) // Ensure required fields exist
          .map(acc => ({
            id: acc.id,
            name: acc.name,
            type: (acc.type as 'cash' | 'momo' | 'credit' | 'investment' | 'checking' | 'savings' | 'loan' | 'other') || 'other',
            balance: acc.balance || 0,
            currency: acc.currency || 'USD',
            color: ('blue' as 'red' | 'green' | 'blue'), // Default color since CRDT doesn't have this field yet
            meta: null, // CRDT doesn't have meta field yet
            isExternal: false, // CRDT doesn't have external fields yet
            providerAccountId: null,
            providerName: null,
            syncStatus: null,
            lastSyncedAt: null,
            connectionId: null,
            createdBy: null, // CRDT doesn't have audit fields yet
            updatedBy: null,
            createdAt: new Date(acc.created_at),
            updatedAt: new Date(acc.updated_at),
            deletedAt: acc.deleted_at ? new Date(acc.deleted_at) : null,
          }));

        await db.insert(schema.accounts).values(accountsData);
      }

      // Insert categories
      if (Object.keys(categories).length > 0) {
        const categoriesData = Object.values(categories)
          .filter(cat => cat.id && cat.name) // Ensure required fields exist
          .map(cat => ({
            id: cat.id,
            name: cat.name,
            parentId: cat.parent_id || null,
            isDefault: false, // CRDT doesn't have is_default field yet
            color: cat.color || null,
            icon: cat.icon || 'Box',
            createdBy: 'system', // CRDT doesn't have audit fields yet
            updatedBy: null,
            createdAt: new Date(cat.created_at),
            updatedAt: new Date(cat.updated_at),
            deletedAt: cat.deleted_at ? new Date(cat.deleted_at) : null,
          }));

        await db.insert(schema.categories).values(categoriesData);
      }

      // Insert transactions
      if (Object.keys(transactions).length > 0) {
        const transactionsData = Object.values(transactions)
          .filter(tx => tx.id && tx.account_id && tx.category_id) // Ensure required fields exist
          .map(tx => ({
            id: tx.id,
            amount: tx.amount || 0,
            type: (tx.type as 'expense' | 'income' | 'transfer') || 'expense',
            accountId: tx.account_id,
            categoryId: tx.category_id!,
            destinationAccountId: tx.destination_account_id || null,
            transactionDatetime: new Date(tx.transaction_datetime),
            description: tx.description || null,
            details: tx.details ? JSON.stringify(tx.details) : null,
            isExternal: tx.is_external || false,
            providerTransactionId: null, // CRDT doesn't have provider fields yet
            createdBy: null, // CRDT doesn't have audit fields yet
            updatedBy: null,
            createdAt: new Date(tx.created_at),
            updatedAt: new Date(tx.updated_at),
            deletedAt: tx.deleted_at ? new Date(tx.deleted_at) : null,
          }));

        await db.insert(schema.transactions).values(transactionsData);
      }

      // Persist changes
      localDb.persist();
      console.log('Database rebuilt from CRDT data successfully');
    } catch (error) {
      console.error('Failed to rebuild database from CRDT data:', error);
      throw error;
    }
  }

  /**
   * Query transactions with filtering and pagination using Drizzle
   * Returns raw transaction data for processing by the offline service
   */
  async queryTransactions(params: GetTransactionsParams): Promise<{
    data: any[];
    pagination: { total: number; totalPages: number; };
  }> {
    await this.ensureInitialized();

    try {
      const db = localDb.get();
      const {
        page = 1,
        limit = 50,
        q: search,
        account_id: accountId,
        category_id: categoryId,
        type,
        start_date: startDate,
        end_date: endDate
        // currency - not used in current filtering
      } = params;

      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [
        isNull(schema.transactions.deletedAt) // Only non-deleted records
      ];

      if (search) {
        conditions.push(like(schema.transactions.description, `%${search}%`));
      }

      if (accountId) {
        conditions.push(eq(schema.transactions.accountId, accountId));
      }

      if (categoryId) {
        conditions.push(eq(schema.transactions.categoryId, categoryId));
      }

      if (type) {
        conditions.push(eq(schema.transactions.type, type as any));
      }

      if (startDate) {
        conditions.push(gte(schema.transactions.transactionDatetime, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(schema.transactions.transactionDatetime, new Date(endDate)));
      }

      // Get total count
      const [{ count: totalCount }] = await db
        .select({ count: count() })
        .from(schema.transactions)
        .where(and(...conditions));

      // Get transactions with joins
      const transactions = await db
        .select({
          // Transaction fields
          id: schema.transactions.id,
          amount: schema.transactions.amount,
          type: schema.transactions.type,
          accountId: schema.transactions.accountId,
          categoryId: schema.transactions.categoryId,
          destinationAccountId: schema.transactions.destinationAccountId,
          transactionDatetime: schema.transactions.transactionDatetime,
          description: schema.transactions.description,
          details: schema.transactions.details,
          isExternal: schema.transactions.isExternal,
          providerTransactionId: schema.transactions.providerTransactionId,
          createdAt: schema.transactions.createdAt,
          updatedAt: schema.transactions.updatedAt,
          
          // Account fields
          accountName: schema.accounts.name,
          accountType: schema.accounts.type,
          accountCurrency: schema.accounts.currency,
          
          // Category fields
          categoryName: schema.categories.name,
          categoryIcon: schema.categories.icon,
          categoryColor: schema.categories.color,
        })
        .from(schema.transactions)
        .leftJoin(schema.accounts, eq(schema.transactions.accountId, schema.accounts.id))
        .leftJoin(schema.categories, eq(schema.transactions.categoryId, schema.categories.id))
        .where(and(...conditions))
        .orderBy(desc(schema.transactions.transactionDatetime))
        .limit(limit)
        .offset(offset);

      // Transform to expected format for the offline transaction service
      const transformedTransactions = transactions.map(tx => ({
        id: tx.id,
        amount: tx.amount,
        type: tx.type,
        account_id: tx.accountId,
        category_id: tx.categoryId,
        destination_account_id: tx.destinationAccountId,
        transaction_datetime: tx.transactionDatetime.toISOString(),
        description: tx.description,
        details: tx.details ? JSON.parse(tx.details as string) : {},
        is_external: tx.isExternal,
        provider_transaction_id: tx.providerTransactionId,
        created_at: tx.createdAt.toISOString(),
        updated_at: tx.updatedAt.toISOString(),
        
        // Add derived fields for grouping
        date_only: tx.transactionDatetime.toISOString().split('T')[0],
        
        // Joined fields for display
        account_name: tx.accountName,
        account_type: tx.accountType,
        account_currency: tx.accountCurrency,
        category_name: tx.categoryName,
        category_icon: tx.categoryIcon,
        category_color: tx.categoryColor,
      }));

      return {
        data: transformedTransactions,
        pagination: {
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      console.error('Failed to query transactions:', error);
      throw error;
    }
  }

  /**
   * Get all accounts
   */
  async getAccounts(): Promise<any[]> {
    await this.ensureInitialized();

    try {
      const db = localDb.get();
      
      const accounts = await db
        .select()
        .from(schema.accounts)
        .where(isNull(schema.accounts.deletedAt))
        .orderBy(asc(schema.accounts.name));

      return accounts.map(acc => ({
        id: acc.id,
        name: acc.name,
        type: acc.type,
        balance: acc.balance,
        currency: acc.currency,
        color: acc.color,
        meta: acc.meta ? JSON.parse(acc.meta as string) : null,
        is_external: acc.isExternal,
        provider_account_id: acc.providerAccountId,
        provider_name: acc.providerName,
        sync_status: acc.syncStatus,
        last_synced_at: acc.lastSyncedAt?.toISOString(),
        connection_id: acc.connectionId,
        created_by: acc.createdBy,
        updated_by: acc.updatedBy,
        created_at: acc.createdAt.toISOString(),
        updated_at: acc.updatedAt.toISOString(),
      }));
    } catch (error) {
      console.error('Failed to get accounts:', error);
      throw error;
    }
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<any[]> {
    await this.ensureInitialized();

    try {
      const db = localDb.get();
      
      const categories = await db
        .select()
        .from(schema.categories)
        .where(isNull(schema.categories.deletedAt))
        .orderBy(asc(schema.categories.name));

      return categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        parent_id: cat.parentId,
        is_default: cat.isDefault,
        color: cat.color,
        icon: cat.icon,
        created_by: cat.createdBy,
        updated_by: cat.updatedBy,
        created_at: cat.createdAt.toISOString(),
        updated_at: cat.updatedAt.toISOString(),
      }));
    } catch (error) {
      console.error('Failed to get categories:', error);
      throw error;
    }
  }

  /**
   * Execute raw SQL query (for backwards compatibility)
   */
  executeRaw(sql: string, params: any[] = []): any[] {
    const rawDb = localDb.getRaw();
    const stmt = rawDb.prepare(sql);
    const result = stmt.getAsObject(params);
    stmt.free();
    return Array.isArray(result) ? result : [result];
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    transactions: number;
    accounts: number;
    categories: number;
  }> {
    await this.ensureInitialized();

    try {
      const db = localDb.get();

      const [transactionsCount] = await db
        .select({ count: count() })
        .from(schema.transactions)
        .where(isNull(schema.transactions.deletedAt));

      const [accountsCount] = await db
        .select({ count: count() })
        .from(schema.accounts)
        .where(isNull(schema.accounts.deletedAt));

      const [categoriesCount] = await db
        .select({ count: count() })
        .from(schema.categories)
        .where(isNull(schema.categories.deletedAt));

      return {
        transactions: transactionsCount.count,
        accounts: accountsCount.count,
        categories: categoriesCount.count,
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      throw error;
    }
  }

  /**
   * Ensure service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    localDb.close();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const drizzleQueryService = new DrizzleQueryService();