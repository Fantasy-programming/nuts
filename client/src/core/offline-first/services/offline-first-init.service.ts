/**
 * Offline-First Initialization Service
 * 
 * Handles the initialization and coordination of all offline-first services
 */

import { crdtService } from './crdt.service';
import { sqliteIndexService } from './sqlite-index.service';
import { syncService } from './sync.service';
import { featureFlagsService } from './feature-flags.service';
import { adaptiveTransactionService } from './adaptive-transaction.service';
import { adaptiveAccountService } from './adaptive-account.service';
import { adaptiveCategoryService } from './adaptive-category.service';

class OfflineFirstInitService {
  private isInitialized = false;
  private initializePromise: Promise<void> | null = null;

  /**
   * Initialize all offline-first services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializePromise) return this.initializePromise;

    this.initializePromise = this.performInitialization();
    await this.initializePromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('🚀 Initializing offline-first services...');

      // Check if offline-first is enabled
      if (!featureFlagsService.isEnabled('offline-first-enabled')) {
        console.log('Offline-first disabled via feature flags');
        return;
      }

      // Initialize services in order
      console.log('1. Initializing CRDT service...');
      await crdtService.initialize();

      console.log('2. Initializing SQLite index service...');
      await sqliteIndexService.initialize();

      console.log('3. Initializing adaptive transaction service...');
      await adaptiveTransactionService.initialize();

      console.log('4. Initializing adaptive account service...');
      await adaptiveAccountService.initialize();

      console.log('5. Initializing adaptive category service...');
      await adaptiveCategoryService.initialize();

      // Initialize sync service if sync is enabled
      if (featureFlagsService.isEnabled('offline-first-sync')) {
        console.log('6. Initializing sync service...');
        await syncService.initialize();
      } else {
        console.log('6. Sync service disabled via feature flags');
      }

      this.isInitialized = true;
      console.log('✅ Offline-first services initialized successfully');

      // Trigger initial data sync if we have existing CRDT data
      if (featureFlagsService.isEnabled('offline-first-sync')) {
        const transactions = crdtService.getTransactions();
        const accounts = crdtService.getAccounts();
        const categories = crdtService.getCategories();

        if (Object.keys(transactions).length > 0 || Object.keys(accounts).length > 0 || Object.keys(categories).length > 0) {
          console.log('🔄 Rebuilding SQLite indices from existing CRDT data...');
          await sqliteIndexService.rebuildIndices(transactions, accounts, categories);
        }
      }

    } catch (error) {
      console.error('❌ Failed to initialize offline-first services:', error);
      throw error;
    }
  }

  /**
   * Check if services are initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get initialization status
   */
  getStatus(): {
    isInitialized: boolean;
    offlineFirstEnabled: boolean;
    syncEnabled: boolean;
    services: {
      crdt: boolean;
      sqlite: boolean;
      adaptiveTransaction: boolean;
      adaptiveAccount: boolean;
      adaptiveCategory: boolean;
      sync: boolean;
    };
  } {
    return {
      isInitialized: this.isInitialized,
      offlineFirstEnabled: featureFlagsService.isEnabled('offline-first-enabled'),
      syncEnabled: featureFlagsService.isEnabled('offline-first-sync'),
      services: {
        crdt: this.isInitialized,
        sqlite: this.isInitialized,
        adaptiveTransaction: this.isInitialized,
        adaptiveAccount: this.isInitialized,
        adaptiveCategory: this.isInitialized,
        sync: featureFlagsService.isEnabled('offline-first-sync') && this.isInitialized,
      }
    };
  }

  /**
   * Reinitialize services (useful when feature flags change)
   */
  async reinitialize(): Promise<void> {
    this.isInitialized = false;
    this.initializePromise = null;
    await this.initialize();
  }

  /**
   * Clear all offline-first data (for logout/reset)
   */
  async clear(): Promise<void> {
    try {
      console.log('🧹 Clearing offline-first data...');
      
      await Promise.all([
        crdtService.clear(),
        sqliteIndexService.clear(),
        syncService.clear()
      ]);

      this.isInitialized = false;
      this.initializePromise = null;
      
      console.log('✅ Offline-first data cleared');
    } catch (error) {
      console.error('❌ Failed to clear offline-first data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const offlineFirstInitService = new OfflineFirstInitService();