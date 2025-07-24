/**
 * Offline-First Services Index
 * 
 * Central export point for all offline-first architecture services
 */

// Core services
export { crdtService } from './services/crdt.service';
export { sqliteIndexService } from './services/sqlite-index.service';
export { featureFlagsService } from './services/feature-flags.service';
export { syncService } from './services/sync.service';
export { offlineFirstInitService } from './services/offline-first-init.service';
export { connectivityService } from './services/connectivity.service';
export { offlineAuthService } from './services/offline-auth.service';

// Adaptive services
export { adaptiveTransactionService } from './services/adaptive-transaction.service';
export { adaptiveAccountService } from './services/adaptive-account.service';
export { adaptiveCategoryService } from './services/adaptive-category.service';
export { offlineFirstTransactionService } from './services/offline-transaction.service';
export { offlineFirstAccountService } from './services/offline-account.service';
export { offlineFirstCategoryService } from './services/offline-category.service';

// Hooks
export { useOfflineFirst, useAdaptiveTransactions, useAdaptiveAccounts, useAdaptiveCategories } from './hooks/useOfflineFirst';

// Test utilities
export { testOfflineFirstInfrastructure } from './test/infrastructure.test';
export { validatePhase2Implementation } from './test/phase2-validation.test';
export { testOfflineFirstPhase3, validatePhase3Implementation } from './test/phase3-validation.test';

// Components
export { FeatureFlagsDeveloperPanel } from './components/FeatureFlagsDeveloperPanel';
export { OfflineStatusIndicator } from './components/OfflineStatusIndicator';
export { OfflineFirstInitializer } from './components/OfflineFirstInitializer';
export { ConflictResolutionIndicator, ConflictResolutionDialog } from './components/ConflictResolutionUI';

// Types
export type { 
  CRDTDocument,
  CRDTTransaction,
  CRDTAccount,
  CRDTCategory,
  CRDTOperation
} from './types/crdt-schema';

export type { FeatureFlag } from './services/feature-flags.service';
export type { SyncStatus, SyncState, SyncConflict } from './services/sync.service';
export type { ConnectivityStatus, ConnectivityState } from './services/connectivity.service';
export type { CachedAuthState } from './services/offline-auth.service';