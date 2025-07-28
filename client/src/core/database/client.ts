/**
 * Database Client - Local-First Database
 * 
 * Drizzle ORM client configured for SQLite with sql.js in the browser.
 * Provides type-safe database operations for offline-first functionality.
 */

import { drizzle } from 'drizzle-orm/sql-js';
import initSqlJs, { Database } from 'sql.js';
import { schema } from './schema';
import { defaultCurrencies } from './schema/currencies';

export class LocalDatabaseClient {
  private db: Database | null = null;
  private drizzleDb: ReturnType<typeof drizzle> | null = null;
  private isInitialized = false;

  /**
   * Initialize the database with SQLite WASM and Drizzle
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize SQL.js
      const SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });

      // Create or load database
      const savedDb = localStorage.getItem('nuts-drizzle-db');
      this.db = savedDb
        ? new SQL.Database(new Uint8Array(JSON.parse(savedDb)))
        : new SQL.Database();

      // Initialize Drizzle with the database
      this.drizzleDb = drizzle(this.db, { schema });

      // Run initial setup
      await this.runInitialSetup();

      this.isInitialized = true;
      console.log('Local database client initialized with Drizzle ORM');
    } catch (error) {
      console.error('Failed to initialize database client:', error);
      throw error;
    }
  }

  /**
   * Get the Drizzle database instance
   */
  get(): ReturnType<typeof drizzle> {
    if (!this.drizzleDb) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.drizzleDb;
  }

  /**
   * Get the raw SQL.js database instance
   */
  getRaw(): Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Save database to localStorage
   */
  persist(): void {
    if (!this.db) return;
    
    const data = this.db.export();
    localStorage.setItem('nuts-drizzle-db', JSON.stringify(Array.from(data)));
  }

  /**
   * Run initial database setup
   */
  private async runInitialSetup(): Promise<void> {
    if (!this.drizzleDb) return;

    try {
      // Create tables manually since we can't use migrations with sql.js easily
      await this.createTables();
      
      // Seed default data
      await this.seedDefaultData();
      
      // Persist changes
      this.persist();
    } catch (error) {
      console.error('Failed to run initial setup:', error);
      throw error;
    }
  }

  /**
   * Create all database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) return;

    const createTablesSQL = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        first_name TEXT,
        last_name TEXT,
        password TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER
      );

      -- Currencies table
      CREATE TABLE IF NOT EXISTS currencies (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );

      -- Accounts table
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        balance REAL NOT NULL DEFAULT 0,
        currency TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT 'blue',
        meta TEXT,
        is_external INTEGER NOT NULL DEFAULT 0,
        provider_account_id TEXT,
        provider_name TEXT,
        sync_status TEXT,
        last_synced_at INTEGER,
        connection_id TEXT,
        created_by TEXT,
        updated_by TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        FOREIGN KEY (currency) REFERENCES currencies(code),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );

      -- Categories table
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id TEXT,
        is_default INTEGER NOT NULL DEFAULT 0,
        color TEXT,
        icon TEXT NOT NULL DEFAULT 'Box',
        created_by TEXT NOT NULL,
        updated_by TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );

      -- Transactions table
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        account_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        destination_account_id TEXT,
        transaction_datetime INTEGER NOT NULL,
        description TEXT,
        details TEXT,
        is_external INTEGER NOT NULL DEFAULT 0,
        provider_transaction_id TEXT,
        created_by TEXT,
        updated_by TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (destination_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );

      -- Preferences table
      CREATE TABLE IF NOT EXISTS preferences (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        locale TEXT NOT NULL DEFAULT 'en',
        theme TEXT NOT NULL DEFAULT 'light',
        currency TEXT NOT NULL DEFAULT 'USD',
        timezone TEXT NOT NULL DEFAULT 'UTC',
        time_format TEXT NOT NULL DEFAULT '24h',
        date_format TEXT NOT NULL DEFAULT 'dd/mm/yyyy',
        start_week_on_monday INTEGER NOT NULL DEFAULT 1,
        dark_sidebar INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (currency) REFERENCES currencies(code)
      );

      -- Tags table
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT 'blue',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Create indices for performance
      CREATE INDEX IF NOT EXISTS idx_accounts_currency ON accounts(currency);
      CREATE INDEX IF NOT EXISTS idx_accounts_created_by ON accounts(created_by);
      CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
      CREATE INDEX IF NOT EXISTS idx_categories_created_by ON categories(created_by);
      CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_datetime ON transactions(transaction_datetime);
      CREATE INDEX IF NOT EXISTS idx_preferences_user_id ON preferences(user_id);
      CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
    `;

    this.db.exec(createTablesSQL);
  }

  /**
   * Seed default data
   */
  private async seedDefaultData(): Promise<void> {
    if (!this.drizzleDb) return;

    try {
      // Check if currencies are already seeded
      const existingCurrencies = await this.drizzleDb.select().from(schema.currencies).limit(1);
      
      if (existingCurrencies.length === 0) {
        // Insert default currencies
        await this.drizzleDb.insert(schema.currencies).values(defaultCurrencies);
        console.log('Default currencies seeded');
      }
    } catch (error) {
      console.warn('Failed to seed default data:', error);
      // Don't throw - this is not critical for initialization
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.persist();
      this.db.close();
      this.db = null;
      this.drizzleDb = null;
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
export const localDb = new LocalDatabaseClient();