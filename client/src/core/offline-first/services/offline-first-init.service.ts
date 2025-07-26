/**
 * Offline-First Initialization Service
 * 
 * Handles the initialization and coordination of all offline-first services
 */

import { crdtService } from './crdt.service';
import { sqliteIndexService } from './sqlite-index.service';
import { syncService } from './sync.service';
import { featureFlagsService } from './feature-flags.service';
import { connectivityService } from './connectivity.service';
import { offlineAuthService } from './offline-auth.service';
import { adaptiveTransactionService } from './adaptive-transaction.service';
import { adaptiveAccountService } from './adaptive-account.service';
import { adaptiveCategoryService } from './adaptive-category.service';
import { adaptivePreferencesService } from './adaptive-preferences.service';

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

      // Initialize connectivity service first
      console.log('1. Initializing connectivity service...');
      // Connectivity service initializes automatically in constructor

      // Initialize offline auth service
      console.log('2. Initializing offline auth service...');
      await offlineAuthService.initialize();

      // Initialize core CRDT services
      console.log('3. Initializing CRDT service...');
      await crdtService.initialize();

      console.log('4. Initializing SQLite index service...');
      await sqliteIndexService.initialize();

      // Initialize adaptive services
      console.log('5. Initializing adaptive transaction service...');
      await adaptiveTransactionService.initialize();

      console.log('6. Initializing adaptive account service...');
      await adaptiveAccountService.initialize();

      console.log('7. Initializing adaptive category service...');
      await adaptiveCategoryService.initialize();

      console.log('8. Initializing adaptive preferences service...');
      await adaptivePreferencesService.initialize();

      // Initialize sync service if sync is enabled and we have connectivity
      if (featureFlagsService.isEnabled('offline-first-sync')) {
        console.log('9. Initializing sync service...');
        await syncService.initialize();
      } else {
        console.log('9. Sync service disabled via feature flags');
      }

      this.isInitialized = true;
      console.log('✅ Offline-first services initialized successfully');

      // Trigger initial data sync if we have existing CRDT data and connectivity
      if (featureFlagsService.isEnabled('offline-first-sync') && connectivityService.hasServerAccess()) {
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
      // Don't throw error - allow app to continue with offline-first disabled
      this.isInitialized = false;
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
        syncService.clear(),
        offlineAuthService.clear()
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