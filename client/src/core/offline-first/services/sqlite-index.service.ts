/**
 * SQLite Indexing Service for Offline-First Architecture
 * 
 * Provides complex query capabilities over CRDT data using SQLite WASM.
 * This service creates and maintains indices for efficient local querying.
 */

import initSqlJs, { Database } from 'sql.js';
import { CRDTTransaction, CRDTAccount, CRDTCategory } from '../types/crdt-schema';

class SQLiteIndexService {
  private db: Database | null = null;
  private isInitialized = false;
  
  /**
   * Initialize SQLite WASM and create database tables
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Initialize SQL.js
      const SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });
      
      // Create new database or load from storage
      const savedDb = localStorage.getItem('nuts-sqlite-db');
      this.db = savedDb 
        ? new SQL.Database(new Uint8Array(JSON.parse(savedDb)))
        : new SQL.Database();
      
      // Create tables if they don't exist
      await this.createTables();
      
      this.isInitialized = true;
      console.log('SQLite indexing service initialized');
    } catch (error) {
      console.error('Failed to initialize SQLite service:', error);
      throw error;
    }
  }
  
  /**
   * Create database tables for indexing
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    // Transactions table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        transaction_datetime TEXT NOT NULL,
        description TEXT NOT NULL,
        category_id TEXT,
        account_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('expense', 'income', 'transfer')),
        destination_account_id TEXT,
        transaction_currency TEXT NOT NULL,
        original_amount REAL NOT NULL,
        is_external BOOLEAN NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        -- Additional fields for efficient querying
        date_only TEXT GENERATED ALWAYS AS (DATE(transaction_datetime)) STORED,
        year_month TEXT GENERATED ALWAYS AS (strftime('%Y-%m', transaction_datetime)) STORED,
        year TEXT GENERATED ALWAYS AS (strftime('%Y', transaction_datetime)) STORED,
        month TEXT GENERATED ALWAYS AS (strftime('%m', transaction_datetime)) STORED
      )
    `);
    
    // Accounts table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        currency TEXT NOT NULL,
        balance REAL NOT NULL,
        is_active BOOLEAN NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      )
    `);
    
    // Categories table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT,
        parent_id TEXT,
        is_active BOOLEAN NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        FOREIGN KEY (parent_id) REFERENCES categories(id)
      )
    `);
    
    // Create indices for efficient querying
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_datetime);
      CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_transactions_date_only ON transactions(date_only);
      CREATE INDEX IF NOT EXISTS idx_transactions_year_month ON transactions(year_month);
      CREATE INDEX IF NOT EXISTS idx_transactions_deleted ON transactions(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
    `);
    
    await this.persist();
  }
  
  /**
   * Rebuild all indices from CRDT data
   */
  async rebuildIndices(
    transactions: Record<string, CRDTTransaction>,
    accounts: Record<string, CRDTAccount>,
    categories: Record<string, CRDTCategory>
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      // Clear existing data
      this.db.run('DELETE FROM transactions');
      this.db.run('DELETE FROM accounts');  
      this.db.run('DELETE FROM categories');
      
      // Insert accounts
      const insertAccount = this.db.prepare(`
        INSERT INTO accounts (id, name, type, currency, balance, is_active, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const account of Object.values(accounts)) {
        // Validate all required fields before binding to SQLite
        const validatedAccount = {
          id: account.id || crypto.randomUUID(),
          name: account.name || '',
          type: account.type || 'checking',
          currency: account.currency || 'USD',
          balance: account.balance || 0,
          is_active: Boolean(account.is_active !== false), // Default to true
          created_at: account.created_at || new Date().toISOString(),
          updated_at: account.updated_at || new Date().toISOString(),
          deleted_at: account.deleted_at || null
        };

        try {
          insertAccount.run([
            validatedAccount.id,
            validatedAccount.name,
            validatedAccount.type,
            validatedAccount.currency,
            validatedAccount.balance,
            validatedAccount.is_active ? 1 : 0,
            validatedAccount.created_at,
            validatedAccount.updated_at,
            validatedAccount.deleted_at
          ]);
        } catch (bindError) {
          console.error('Error binding account to SQLite:', bindError, validatedAccount);
          throw bindError;
        }
      }
      insertAccount.free();
      
      // Insert categories
      const insertCategory = this.db.prepare(`
        INSERT INTO categories (id, name, color, icon, parent_id, is_active, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const category of Object.values(categories)) {
        // Validate all required fields before binding to SQLite
        const validatedCategory = {
          id: category.id || crypto.randomUUID(),
          name: category.name || '',
          color: category.color || '#000000',
          icon: category.icon || null,
          parent_id: category.parent_id || null,
          is_active: Boolean(category.is_active !== false), // Default to true
          created_at: category.created_at || new Date().toISOString(),
          updated_at: category.updated_at || new Date().toISOString(),
          deleted_at: category.deleted_at || null
        };

        try {
          insertCategory.run([
            validatedCategory.id,
            validatedCategory.name,
            validatedCategory.color,
            validatedCategory.icon,
            validatedCategory.parent_id,
            validatedCategory.is_active ? 1 : 0,
            validatedCategory.created_at,
            validatedCategory.updated_at,
            validatedCategory.deleted_at
          ]);
        } catch (bindError) {
          console.error('Error binding category to SQLite:', bindError, validatedCategory);
          throw bindError;
        }
      }
      insertCategory.free();
      
      // Insert transactions
      const insertTransaction = this.db.prepare(`
        INSERT INTO transactions (
          id, amount, transaction_datetime, description, category_id, account_id,
          type, destination_account_id, transaction_currency, original_amount,
          is_external, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const transaction of Object.values(transactions)) {
        // Validate all required fields before binding to SQLite
        const validatedTransaction = {
          id: transaction.id || crypto.randomUUID(),
          amount: transaction.amount || 0,
          transaction_datetime: transaction.transaction_datetime || new Date().toISOString(),
          description: transaction.description || '',
          category_id: transaction.category_id || null,
          account_id: transaction.account_id || '',
          type: transaction.type || 'expense',
          destination_account_id: transaction.destination_account_id || null,
          transaction_currency: transaction.transaction_currency || 'USD',
          original_amount: transaction.original_amount || transaction.amount || 0,
          is_external: Boolean(transaction.is_external),
          created_at: transaction.created_at || new Date().toISOString(),
          updated_at: transaction.updated_at || new Date().toISOString(),
          deleted_at: transaction.deleted_at || null
        };

        try {
          insertTransaction.run([
            validatedTransaction.id,
            validatedTransaction.amount,
            validatedTransaction.transaction_datetime,
            validatedTransaction.description,
            validatedTransaction.category_id,
            validatedTransaction.account_id,
            validatedTransaction.type,
            validatedTransaction.destination_account_id,
            validatedTransaction.transaction_currency,
            validatedTransaction.original_amount,
            validatedTransaction.is_external ? 1 : 0,
            validatedTransaction.created_at,
            validatedTransaction.updated_at,
            validatedTransaction.deleted_at
          ]);
        } catch (bindError) {
          console.error('Error binding transaction to SQLite:', bindError, validatedTransaction);
          throw bindError;
        }
      }
      insertTransaction.free();
      
      await this.persist();
      console.log('SQLite indices rebuilt successfully');
    } catch (error) {
      console.error('Failed to rebuild SQLite indices:', error);
      throw error;
    }
  }
  
  /**
   * Query transactions with filtering and pagination
   */
  queryTransactions(params: {
    page?: number;
    limit?: number;
    search?: string;
    accountId?: string;
    categoryId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    currency?: string;
  }): {
    transactions: any[];
    totalCount: number;
    totalPages: number;
  } {
    if (!this.db) throw new Error('Database not initialized');
    
    const {
      page = 1,
      limit = 25,
      search,
      accountId,
      categoryId,
      type,
      startDate,
      endDate,
      currency
    } = params;
    
    let whereConditions: string[] = ['deleted_at IS NULL'];
    let queryParams: any[] = [];
    
    // Build WHERE conditions
    if (search) {
      whereConditions.push('description LIKE ?');
      queryParams.push(`%${search}%`);
    }
    
    if (accountId) {
      whereConditions.push('account_id = ?');
      queryParams.push(accountId);
    }
    
    if (categoryId) {
      whereConditions.push('category_id = ?');
      queryParams.push(categoryId);
    }
    
    if (type) {
      whereConditions.push('type = ?');
      queryParams.push(type);
    }
    
    if (startDate) {
      whereConditions.push('DATE(transaction_datetime) >= ?');
      queryParams.push(startDate);
    }
    
    if (endDate) {
      whereConditions.push('DATE(transaction_datetime) <= ?');
      queryParams.push(endDate);
    }
    
    if (currency) {
      whereConditions.push('transaction_currency = ?');
      queryParams.push(currency);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions
      ${whereClause}
    `;
    
    const countResult = this.db.exec(countQuery, queryParams);
    const totalCount = countResult[0]?.values[0]?.[0] as number || 0;
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get paginated results
    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT 
        t.*,
        a.name as account_name,
        a.currency as account_currency,
        c.name as category_name,
        c.color as category_color
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      ${whereClause}
      ORDER BY transaction_datetime DESC
      LIMIT ? OFFSET ?
    `;
    
    const dataResult = this.db.exec(dataQuery, [...queryParams, limit, offset]);
    
    const transactions = dataResult[0]?.values.map((row: any[]) => {
      const columns = dataResult[0].columns;
      const transaction: any = {};
      
      row.forEach((value: any, index: number) => {
        transaction[columns[index]] = value;
      });
      
      return transaction;
    }) || [];
    
    return {
      transactions,
      totalCount,
      totalPages
    };
  }
  
  /**
   * Get transaction analytics
   */
  getAnalytics(params: {
    startDate?: string;
    endDate?: string;
    accountId?: string;
    groupBy?: 'day' | 'month' | 'year' | 'category';
  }): any[] {
    if (!this.db) throw new Error('Database not initialized');
    
    const { startDate, endDate, accountId, groupBy = 'month' } = params;
    
    let whereConditions: string[] = ['deleted_at IS NULL', "type != 'transfer'"];
    let queryParams: any[] = [];
    
    if (startDate) {
      whereConditions.push('DATE(transaction_datetime) >= ?');
      queryParams.push(startDate);
    }
    
    if (endDate) {
      whereConditions.push('DATE(transaction_datetime) <= ?');
      queryParams.push(endDate);
    }
    
    if (accountId) {
      whereConditions.push('account_id = ?');
      queryParams.push(accountId);
    }
    
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    
    let groupByClause: string;
    let selectFields: string;
    
    switch (groupBy) {
      case 'day':
        selectFields = `date_only as period, DATE(transaction_datetime) as date`;
        groupByClause = 'GROUP BY date_only';
        break;
      case 'year':
        selectFields = `year as period, year`;
        groupByClause = 'GROUP BY year';
        break;
      case 'category':
        selectFields = `category_id as period, c.name as category_name, c.color as category_color`;
        groupByClause = 'GROUP BY category_id';
        break;
      default: // month
        selectFields = `year_month as period, year_month`;
        groupByClause = 'GROUP BY year_month';
    }
    
    const query = `
      SELECT 
        ${selectFields},
        SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as total_expenses,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        COUNT(*) as transaction_count
      FROM transactions t
      ${groupBy === 'category' ? 'LEFT JOIN categories c ON t.category_id = c.id' : ''}
      ${whereClause}
      ${groupByClause}
      ORDER BY period
    `;
    
    const result = this.db.exec(query, queryParams);
    
    return result[0]?.values.map((row: any[]) => {
      const columns = result[0].columns;
      const analytics: any = {};
      
      row.forEach((value: any, index: number) => {
        analytics[columns[index]] = value;
      });
      
      return analytics;
    }) || [];
  }
  
  /**
   * Persist database to local storage
   */
  async persist(): Promise<void> {
    if (!this.db) return;
    
    try {
      const data = this.db.export();
      localStorage.setItem('nuts-sqlite-db', JSON.stringify(Array.from(data)));
    } catch (error) {
      console.error('Failed to persist SQLite database:', error);
      throw error;
    }
  }
  
  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    localStorage.removeItem('nuts-sqlite-db');
    this.db?.close();
    this.db = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const sqliteIndexService = new SQLiteIndexService();