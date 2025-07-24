/**
 * Synchronization Service for Offline-First Architecture
 * 
 * Handles bidirectional sync between local CRDT documents and the server.
 * Manages conflict resolution, offline queue, and background sync.
 */

import { crdtService } from './crdt.service';
import { sqliteIndexService } from './sqlite-index.service';
import { featureFlagsService } from './feature-flags.service';
import { api as axios } from '@/lib/axios';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'conflict';

export interface SyncState {
  status: SyncStatus;
  lastSyncAt: Date | null;
  pendingOperations: number;
  error: string | null;
  isOnline: boolean;
}

export interface SyncConflict {
  id: string;
  type: 'transaction' | 'account' | 'category';
  localVersion: any;
  serverVersion: any;
  timestamp: Date;
}

class SyncService {
  private syncState: SyncState = {
    status: 'offline',
    lastSyncAt: null,
    pendingOperations: 0,
    error: null,
    isOnline: navigator.onLine
  };

  private syncQueue: Array<{
    id: string;
    operation: 'create' | 'update' | 'delete';
    type: 'transaction' | 'account' | 'category';
    data: any;
    timestamp: Date;
  }> = [];

  private conflicts: SyncConflict[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(state: SyncState) => void> = new Set();

  constructor() {
    this.setupOnlineStatusListener();
    this.loadSyncQueue();
    this.loadConflicts();
  }

  /**
   * Initialize the sync service
   */
  async initialize(): Promise<void> {
    if (!featureFlagsService.useSyncEnabled()) {
      console.log('Sync is disabled via feature flags');
      return;
    }

    try {
      await this.startBackgroundSync();
      console.log('Sync service initialized');
    } catch (error) {
      console.error('Failed to initialize sync service:', error);
      this.updateSyncState({ status: 'error', error: 'Failed to initialize sync' });
    }
  }

  /**
   * Start background sync process
   */
  async startBackgroundSync(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Initial sync
    await this.performSync();

    // Schedule periodic sync every 30 seconds
    this.syncInterval = setInterval(async () => {
      if (this.syncState.isOnline && featureFlagsService.useSyncEnabled()) {
        await this.performSync();
      }
    }, 30000);
  }

  /**
   * Stop background sync
   */
  stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Perform a complete sync cycle
   */
  async performSync(): Promise<void> {
    if (!this.syncState.isOnline) return;

    this.updateSyncState({ status: 'syncing' });

    try {
      // 1. Push local changes to server
      await this.pushLocalChanges();

      // 2. Pull server changes
      await this.pullServerChanges();

      // 3. Update sync state
      this.updateSyncState({
        status: this.conflicts.length > 0 ? 'conflict' : 'synced',
        lastSyncAt: new Date(),
        error: null
      });

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      this.updateSyncState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Sync failed'
      });
    }
  }

  /**
   * Push local changes to server
   */
  private async pushLocalChanges(): Promise<void> {
    const queueCopy = [...this.syncQueue];
    const successfulOperations: string[] = [];

    for (const operation of queueCopy) {
      try {
        await this.pushOperation(operation);
        successfulOperations.push(operation.id);
      } catch (error) {
        console.error('Failed to push operation:', operation, error);
        // Continue with other operations
      }
    }

    // Remove successful operations from queue
    this.syncQueue = this.syncQueue.filter(op => !successfulOperations.includes(op.id));
    this.updateSyncState({ pendingOperations: this.syncQueue.length });
    this.persistSyncQueue();
  }

  /**
   * Push a single operation to server
   */
  private async pushOperation(operation: any): Promise<void> {
    const endpoint = this.getEndpointForOperation(operation);

    switch (operation.operation) {
      case 'create':
        await axios.post(endpoint, operation.data);
        break;
      case 'update':
        await axios.put(`${endpoint}/${operation.data.id}`, operation.data);
        break;
      case 'delete':
        await axios.delete(`${endpoint}/${operation.data.id}`);
        break;
    }
  }

  /**
   * Pull server changes and merge with local CRDT
   */
  private async pullServerChanges(): Promise<void> {
    try {
      // Get the last sync timestamp to fetch only new changes
      const lastSync = this.syncState.lastSyncAt?.toISOString() || new Date(0).toISOString();

      // Try to fetch incremental changes from sync endpoints
      const transactionsResponse = await axios.get('/transactions/sync', {
        params: { since: lastSync }
      });

      const accountsResponse = await axios.get('/accounts/sync', {
        params: { since: lastSync }
      });

      const categoriesResponse = await axios.get('/categories/sync', {
        params: { since: lastSync }
      });

      // Merge changes into local CRDT
      await this.mergeServerChanges({
        transactions: transactionsResponse.data,
        accounts: accountsResponse.data,
        categories: categoriesResponse.data
      });

    } catch (error) {
      // Sync endpoints don't exist yet, perform full sync fallback
      console.warn('Sync endpoints not available, performing full sync fallback:', error);
      await this.performFullSync();
    }
  }

  /**
   * Perform full data sync (fallback when incremental sync isn't available)
   */
  private async performFullSync(): Promise<void> {
    try {
      // Fetch all data from server
      const [transactionsResponse, accountsResponse, categoriesResponse] = await Promise.all([
        axios.get('/transactions'),
        axios.get('/accounts'),
        axios.get('/categories')
      ]);

      // Extract and convert server data to CRDT format
      const serverData = {
        transactions: this.convertServerDataToCRDT(
          transactionsResponse.data?.data || transactionsResponse.data || []
        ),
        accounts: this.convertServerDataToCRDT(
          accountsResponse.data?.data || accountsResponse.data || []
        ),
        categories: this.convertServerDataToCRDT(
          categoriesResponse.data?.data || categoriesResponse.data || []
        )
      };

      await this.mergeServerChanges(serverData);
    } catch (error) {
      console.error('Full sync failed:', error);
      throw error;
    }
  }

  /**
   * Merge server changes into local CRDT
   */
  private async mergeServerChanges(serverData: {
    transactions: any[];
    accounts: any[];
    categories: any[];
  }): Promise<void> {
    try {
      // Get current local data
      const localTransactions = crdtService.getTransactions();
      const localAccounts = crdtService.getAccounts();
      const localCategories = crdtService.getCategories();

      // Merge transactions
      for (const serverTx of serverData.transactions) {
        if (!serverTx.id) {
          console.warn('Skipping transaction without ID:', serverTx);
          continue;
        }

        const localTx = localTransactions[serverTx.id];

        if (!localTx) {
          // New transaction from server
          await crdtService.createTransaction(serverTx);
        } else if (new Date(serverTx.updated_at) > new Date(localTx.updated_at)) {
          // Server version is newer
          if (this.hasLocalModifications(localTx, serverTx)) {
            // Conflict detected
            this.addConflict({
              id: serverTx.id,
              type: 'transaction',
              localVersion: localTx,
              serverVersion: serverTx,
              timestamp: new Date()
            });
          } else {
            // Safe to update
            await crdtService.updateTransaction(serverTx.id, serverTx);
          }
        }
      }

      // Merge accounts
      for (const serverAccount of serverData.accounts) {
        if (!serverAccount.id) {
          console.warn('Skipping account without ID:', serverAccount);
          continue;
        }

        const localAccount = localAccounts[serverAccount.id];

        if (!localAccount) {
          // New account from server
          await crdtService.createAccount(serverAccount);
        } else if (new Date(serverAccount.updated_at) > new Date(localAccount.updated_at)) {
          // Server version is newer
          if (this.hasLocalModifications(localAccount, serverAccount)) {
            // Conflict detected
            this.addConflict({
              id: serverAccount.id,
              type: 'account',
              localVersion: localAccount,
              serverVersion: serverAccount,
              timestamp: new Date()
            });
          } else {
            // Safe to update
            await crdtService.updateAccount(serverAccount.id, serverAccount);
          }
        }
      }

      // Merge categories
      for (const serverCategory of serverData.categories) {
        if (!serverCategory.id) {
          console.warn('Skipping category without ID:', serverCategory);
          continue;
        }

        const localCategory = localCategories[serverCategory.id];

        if (!localCategory) {
          // New category from server
          await crdtService.createCategory(serverCategory);
        } else if (new Date(serverCategory.updated_at) > new Date(localCategory.updated_at)) {
          // Server version is newer
          if (this.hasLocalModifications(localCategory, serverCategory)) {
            // Conflict detected
            this.addConflict({
              id: serverCategory.id,
              type: 'category',
              localVersion: localCategory,
              serverVersion: serverCategory,
              timestamp: new Date()
            });
          } else {
            // Safe to update
            await crdtService.updateCategory(serverCategory.id, serverCategory);
          }
        }
      }

      // Rebuild SQLite indices after merging
      await sqliteIndexService.rebuildIndices(
        crdtService.getTransactions(),
        crdtService.getAccounts(),
        crdtService.getCategories()
      );
    } catch (error) {
      console.error('Error merging server changes:', error);
      throw error;
    }
  }
  }

  /**
   * Check if local data has modifications that conflict with server
   */
  private hasLocalModifications(local: any, server: any): boolean {
    // Simple conflict detection - in reality, this would be more sophisticated
    return local.updated_at !== server.updated_at;
  }

  /**
   * Add an operation to the sync queue
   */
  addToSyncQueue(operation: {
    operation: 'create' | 'update' | 'delete';
    type: 'transaction' | 'account' | 'category';
    data: any;
  }): void {
    const queueItem = {
      ...operation,
      id: `${operation.type}_${operation.data.id}_${Date.now()}`,
      timestamp: new Date()
    };

    this.syncQueue.push(queueItem);
    this.updateSyncState({ pendingOperations: this.syncQueue.length });
    this.persistSyncQueue();

    // Trigger immediate sync if online
    if (this.syncState.isOnline && featureFlagsService.useSyncEnabled()) {
      this.performSync().catch(console.error);
    }
  }

  /**
   * Resolve a sync conflict
   */
  async resolveConflict(conflictId: string, resolution: 'local' | 'server' | 'merge'): Promise<void> {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    try {
      switch (resolution) {
        case 'local':
          // Keep local version, add to sync queue to push to server
          this.addToSyncQueue({
            operation: 'update',
            type: conflict.type,
            data: conflict.localVersion
          });
          break;

        case 'server':
          // Accept server version
          if (conflict.type === 'transaction') {
            await crdtService.updateTransaction(conflict.id, conflict.serverVersion);
          }
          // Similar for accounts and categories
          break;

        case 'merge':
          // Custom merge logic would go here
          // For now, default to server version
          if (conflict.type === 'transaction') {
            await crdtService.updateTransaction(conflict.id, conflict.serverVersion);
          }
          break;
      }

      // Remove resolved conflict
      this.conflicts = this.conflicts.filter(c => c.id !== conflictId);
      this.persistConflicts();

      // Update sync status
      this.updateSyncState({
        status: this.conflicts.length > 0 ? 'conflict' : 'synced'
      });

    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  }

  /**
   * Get current sync state
   */
  getSyncState(): SyncState {
    return { ...this.syncState };
  }

  /**
   * Subscribe to sync state changes
   */
  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current conflicts
   */
  getConflicts(): SyncConflict[] {
    return [...this.conflicts];
  }

  /**
   * Force a manual sync
   */
  async forcSync(): Promise<void> {
    await this.performSync();
  }

  // Private helper methods

  private updateSyncState(updates: Partial<SyncState>): void {
    this.syncState = { ...this.syncState, ...updates };
    this.listeners.forEach(listener => listener(this.getSyncState()));
  }

  private setupOnlineStatusListener(): void {
    window.addEventListener('online', () => {
      this.updateSyncState({ isOnline: true });
      if (featureFlagsService.useSyncEnabled()) {
        this.performSync().catch(console.error);
      }
    });

    window.addEventListener('offline', () => {
      this.updateSyncState({ isOnline: false, status: 'offline' });
    });
  }

  private getEndpointForOperation(operation: any): string {
    switch (operation.type) {
      case 'transaction': return '/transactions';
      case 'account': return '/accounts';
      case 'category': return '/categories';
      default: throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private convertServerDataToCRDT(data: any[]): any[] {
    if (!Array.isArray(data)) {
      console.warn('Expected array data for CRDT conversion, got:', typeof data);
      return [];
    }

    return data.map(item => {
      // Ensure all required CRDT fields are present with proper fallbacks
      const converted = {
        ...item,
        id: item.id || crypto.randomUUID(),
        created_at: item.created_at || item.createdAt || new Date().toISOString(),
        updated_at: item.updated_at || item.updatedAt || new Date().toISOString(),
        deleted_at: item.deleted_at || item.deletedAt || null,
      };

      // Handle transaction-specific fields
      if (item.transaction_datetime || item.transactionDatetime) {
        converted.transaction_datetime = item.transaction_datetime || item.transactionDatetime;
      }
      
      // Handle numeric fields that might come as objects from PostgreSQL
      if (item.amount && typeof item.amount === 'object') {
        converted.amount = parseFloat(item.amount.String || item.amount.value || item.amount) || 0;
      }
      
      if (item.original_amount && typeof item.original_amount === 'object') {
        converted.original_amount = parseFloat(item.original_amount.String || item.original_amount.value || item.original_amount) || 0;
      }

      // Ensure boolean fields are properly converted
      converted.is_external = Boolean(item.is_external);
      converted.is_active = Boolean(item.is_active !== false); // Default to true if not specified

      // Handle optional UUID fields
      converted.category_id = item.category_id || null;
      converted.destination_account_id = item.destination_account_id || null;
      converted.parent_id = item.parent_id || null;

      // Ensure required string fields have fallback values
      converted.type = item.type || 'expense';
      converted.description = item.description || '';
      converted.transaction_currency = item.transaction_currency || 'USD';
      converted.name = item.name || '';
      converted.currency = item.currency || 'USD';
      converted.color = item.color || '#000000';

      return converted;
    });
  }

  private addConflict(conflict: SyncConflict): void {
    this.conflicts.push(conflict);
    this.persistConflicts();
  }

  private persistSyncQueue(): void {
    try {
      localStorage.setItem('nuts-sync-queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to persist sync queue:', error);
    }
  }

  private loadSyncQueue(): void {
    try {
      const stored = localStorage.getItem('nuts-sync-queue');
      if (stored) {
        this.syncQueue = JSON.parse(stored);
        this.updateSyncState({ pendingOperations: this.syncQueue.length });
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  private persistConflicts(): void {
    try {
      localStorage.setItem('nuts-sync-conflicts', JSON.stringify(this.conflicts));
    } catch (error) {
      console.error('Failed to persist conflicts:', error);
    }
  }

  private loadConflicts(): void {
    try {
      const stored = localStorage.getItem('nuts-sync-conflicts');
      if (stored) {
        this.conflicts = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  }

  /**
   * Clear all sync data (for logout/reset)
   */
  async clear(): Promise<void> {
    this.stopBackgroundSync();
    this.syncQueue = [];
    this.conflicts = [];
    localStorage.removeItem('nuts-sync-queue');
    localStorage.removeItem('nuts-sync-conflicts');
    this.updateSyncState({
      status: 'offline',
      lastSyncAt: null,
      pendingOperations: 0,
      error: null
    });
  }
}

// Export singleton instance
export const syncService = new SyncService();
