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

// Adaptive services
export { adaptiveTransactionService } from './services/adaptive-transaction.service';
export { offlineFirstTransactionService } from './services/offline-transaction.service';

// Hooks
export { useOfflineFirst, useAdaptiveTransactions } from './hooks/useOfflineFirst';

// Test utilities
export { testOfflineFirstInfrastructure } from './test/infrastructure.test';

// Components
export { FeatureFlagsDeveloperPanel } from './components/FeatureFlagsDeveloperPanel';
export { OfflineStatusIndicator } from './components/OfflineStatusIndicator';
export { OfflineFirstInitializer } from './components/OfflineFirstInitializer';

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