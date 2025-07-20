/**
 * CRDT Service for Offline-First Architecture
 * 
 * Handles Automerge document operations, persistence, and synchronization.
 * This service manages the CRDT document lifecycle and provides APIs for
 * local-first data operations.
 */

import { next as Automerge } from '@automerge/automerge';
import { CRDTDocument, CRDTTransaction, CRDTAccount, CRDTCategory } from '../types/crdt-schema';

class CRDTService {
  private doc: Automerge.Doc<CRDTDocument> | null = null;
  private storageKey: string = 'nuts-crdt-document';
  
  /**
   * Initialize the CRDT document from local storage or create new
   */
  async initialize(): Promise<void> {
    try {
      const savedDoc = localStorage.getItem(this.storageKey);
      
      if (savedDoc) {
        // Load existing document from local storage
        const binaryDoc = new Uint8Array(JSON.parse(savedDoc));
        this.doc = Automerge.load(binaryDoc);
        console.log('Loaded existing CRDT document from storage');
      } else {
        // Create new document
        this.doc = Automerge.from<CRDTDocument>({
          version: '1.0.0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: '', // Will be set when user is available
          transactions: {},
          accounts: {},
          categories: {},
          rules: {},
          indices: {
            version: 1,
          },
        });
        console.log('Created new CRDT document');
        await this.persist();
      }
    } catch (error) {
      console.error('Failed to initialize CRDT document:', error);
      throw error;
    }
  }
  
  /**
   * Get the current document state
   */
  getDocument(): CRDTDocument | null {
    return this.doc ? Automerge.save(this.doc) as any : null;
  }
  
  /**
   * Persist the document to local storage
   */
  async persist(): Promise<void> {
    if (!this.doc) return;
    
    try {
      const binaryDoc = Automerge.save(this.doc);
      localStorage.setItem(this.storageKey, JSON.stringify(Array.from(binaryDoc)));
    } catch (error) {
      console.error('Failed to persist CRDT document:', error);
      throw error;
    }
  }
  
  /**
   * Create a new transaction in the CRDT document
   */
  async createTransaction(transaction: Omit<CRDTTransaction, 'created_at' | 'updated_at'>): Promise<string> {
    if (!this.doc) throw new Error('CRDT document not initialized');
    
    const timestamp = new Date().toISOString();
    const transactionWithTimestamps: CRDTTransaction = {
      ...transaction,
      created_at: timestamp,
      updated_at: timestamp,
    };
    
    this.doc = Automerge.change(this.doc, doc => {
      doc.transactions[transaction.id] = transactionWithTimestamps;
      doc.updated_at = timestamp;
    });
    
    await this.persist();
    return transaction.id;
  }
  
  /**
   * Update an existing transaction
   */
  async updateTransaction(id: string, updates: Partial<CRDTTransaction>): Promise<void> {
    if (!this.doc) throw new Error('CRDT document not initialized');
    
    const timestamp = new Date().toISOString();
    
    this.doc = Automerge.change(this.doc, doc => {
      if (doc.transactions[id]) {
        Object.assign(doc.transactions[id], updates, { updated_at: timestamp });
        doc.updated_at = timestamp;
      }
    });
    
    await this.persist();
  }
  
  /**
   * Soft delete a transaction (set deleted_at timestamp)
   */
  async deleteTransaction(id: string): Promise<void> {
    if (!this.doc) throw new Error('CRDT document not initialized');
    
    const timestamp = new Date().toISOString();
    
    this.doc = Automerge.change(this.doc, doc => {
      if (doc.transactions[id]) {
        doc.transactions[id].deleted_at = timestamp;
        doc.updated_at = timestamp;
      }
    });
    
    await this.persist();
  }
  
  /**
   * Get all active (non-deleted) transactions
   */
  getTransactions(): Record<string, CRDTTransaction> {
    if (!this.doc) return {};
    
    const currentDoc = this.doc as any;
    const transactions: Record<string, CRDTTransaction> = {};
    
    for (const [id, transaction] of Object.entries(currentDoc.transactions || {})) {
      const tx = transaction as CRDTTransaction;
      if (!tx.deleted_at) {
        transactions[id] = tx;
      }
    }
    
    return transactions;
  }
  
  /**
   * Get a specific transaction by ID
   */
  getTransaction(id: string): CRDTTransaction | null {
    if (!this.doc) return null;
    
    const currentDoc = this.doc as any;
    const transaction = currentDoc.transactions?.[id] as CRDTTransaction;
    
    return transaction && !transaction.deleted_at ? transaction : null;
  }
  
  /**
   * Account operations
   */
  async createAccount(account: Omit<CRDTAccount, 'created_at' | 'updated_at'>): Promise<string> {
    if (!this.doc) throw new Error('CRDT document not initialized');
    
    const timestamp = new Date().toISOString();
    const accountWithTimestamps: CRDTAccount = {
      ...account,
      created_at: timestamp,
      updated_at: timestamp,
    };
    
    this.doc = Automerge.change(this.doc, doc => {
      doc.accounts[account.id] = accountWithTimestamps;
      doc.updated_at = timestamp;
    });
    
    await this.persist();
    return account.id;
  }
  
  async updateAccount(id: string, updates: Partial<CRDTAccount>): Promise<void> {
    if (!this.doc) throw new Error('CRDT document not initialized');
    
    const timestamp = new Date().toISOString();
    
    this.doc = Automerge.change(this.doc, doc => {
      if (doc.accounts[id]) {
        Object.assign(doc.accounts[id], updates, { updated_at: timestamp });
        doc.updated_at = timestamp;
      }
    });
    
    await this.persist();
  }
  
  getAccounts(): Record<string, CRDTAccount> {
    if (!this.doc) return {};
    
    const currentDoc = this.doc as any;
    const accounts: Record<string, CRDTAccount> = {};
    
    for (const [id, account] of Object.entries(currentDoc.accounts || {})) {
      const acc = account as CRDTAccount;
      if (!acc.deleted_at) {
        accounts[id] = acc;
      }
    }
    
    return accounts;
  }
  
  /**
   * Category operations
   */
  async createCategory(category: Omit<CRDTCategory, 'created_at' | 'updated_at'>): Promise<string> {
    if (!this.doc) throw new Error('CRDT document not initialized');
    
    const timestamp = new Date().toISOString();
    const categoryWithTimestamps: CRDTCategory = {
      ...category,
      created_at: timestamp,
      updated_at: timestamp,
    };
    
    this.doc = Automerge.change(this.doc, doc => {
      doc.categories[category.id] = categoryWithTimestamps;
      doc.updated_at = timestamp;
    });
    
    await this.persist();
    return category.id;
  }
  
  getCategories(): Record<string, CRDTCategory> {
    if (!this.doc) return {};
    
    const currentDoc = this.doc as any;
    const categories: Record<string, CRDTCategory> = {};
    
    for (const [id, category] of Object.entries(currentDoc.categories || {})) {
      const cat = category as CRDTCategory;
      if (!cat.deleted_at) {
        categories[id] = cat;
      }
    }
    
    return categories;
  }
  
  /**
   * Merge changes from another CRDT document (for sync)
   */
  async merge(otherDocBinary: Uint8Array): Promise<void> {
    if (!this.doc) throw new Error('CRDT document not initialized');
    
    try {
      const otherDoc = Automerge.load<CRDTDocument>(otherDocBinary);
      this.doc = Automerge.merge(this.doc, otherDoc);
      await this.persist();
      console.log('Successfully merged CRDT documents');
    } catch (error) {
      console.error('Failed to merge CRDT documents:', error);
      throw error;
    }
  }
  
  /**
   * Get binary representation for sync
   */
  getBinaryDocument(): Uint8Array | null {
    if (!this.doc) return null;
    return Automerge.save(this.doc);
  }
  
  /**
   * Clear all data (for logout/reset)
   */
  async clear(): Promise<void> {
    localStorage.removeItem(this.storageKey);
    this.doc = null;
  }
}

// Export singleton instance
export const crdtService = new CRDTService();