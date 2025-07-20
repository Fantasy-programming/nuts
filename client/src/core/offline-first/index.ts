/**
 * Offline-First Services Index
 * 
 * Central export point for all offline-first architecture services
 */

// Core services
export { crdtService } from './services/crdt.service';
export { sqliteIndexService } from './services/sqlite-index.service';
export { featureFlagsService } from './services/feature-flags.service';

// Adaptive services
export { adaptiveTransactionService } from './services/adaptive-transaction.service';
export { offlineFirstTransactionService } from './services/offline-transaction.service';

// Types
export type { 
  CRDTDocument,
  CRDTTransaction,
  CRDTAccount,
  CRDTCategory,
  CRDTOperation
} from './types/crdt-schema';

export type { FeatureFlag } from './services/feature-flags.service';