# Phase 2 Offline-First Implementation Guide

## Overview

Phase 2 of the offline-first migration adds synchronization, status indicators, and enhanced initialization to the existing CRDT infrastructure from Phase 1.

## New Features in Phase 2

### 1. Synchronization Service (`SyncService`)
- **Bidirectional sync** between local CRDT documents and server
- **Conflict resolution** with manual resolution options
- **Background sync** every 30 seconds when online
- **Offline queue** that stores operations when offline
- **Online/offline detection** with automatic sync resumption

### 2. Enhanced Feature Flags
- **Auto-enable in development** - Offline-first is automatically enabled in development mode
- **Granular control** - Individual flags for transactions, accounts, categories, analytics, and sync
- **Persistent storage** - Settings are saved in localStorage

### 3. UI Components
- **OfflineStatusIndicator** - Shows sync status, pending operations, and connection state
- **FeatureFlagsDeveloperPanel** - Developer tool for testing feature flags
- **OfflineFirstInitializer** - Loading wrapper that initializes services

### 4. React Hooks
- **useOfflineFirst** - Manages offline-first initialization state
- **useAdaptiveTransactions** - Provides transaction service with offline-first status

### 5. Initialization Service
- **Coordinated startup** - Manages initialization order of all services
- **Status monitoring** - Provides detailed status of each service
- **Graceful fallbacks** - Handles initialization failures

## Testing the Implementation

### Browser Console Testing

Open the browser console (F12) and run these commands:

#### Test Phase 2 Infrastructure
```javascript
// Run the comprehensive Phase 2 test
await testOfflineFirstPhase2()

// Or use the alias
await testOfflineFirst()
```

#### Validate Implementation
```javascript
// Validate all Phase 2 components are working
await validatePhase2()
```

#### Manual Feature Flag Testing
```javascript
// Check current flags
featureFlagsService.getAllFlags()

// Enable development mode (enables most offline-first features)
featureFlagsService.enableDevelopmentMode()

// Test individual flags
featureFlagsService.enable('offline-first-sync')
featureFlagsService.disable('offline-first-sync')

// Check specific functionality
featureFlagsService.useOfflineFirstTransactions()
featureFlagsService.useSyncEnabled()
```

#### Sync Service Testing
```javascript
// Check sync status
syncService.getSyncState()

// Force manual sync
await syncService.forcSync()

// Check pending operations
console.log('Pending operations:', syncService.getSyncState().pendingOperations)
```

### Feature Flag Combinations

#### Development Mode (Recommended)
```javascript
featureFlagsService.enableDevelopmentMode()
```
Enables:
- `offline-first-enabled: true`
- `offline-first-transactions: true`
- `offline-first-accounts: true`
- `offline-first-categories: true`
- `offline-first-analytics: false` (kept server-based)
- `offline-first-sync: false` (disabled initially)

#### Full Offline Mode (Advanced Testing)
```javascript
featureFlagsService.setFlags({
  'offline-first-enabled': true,
  'offline-first-transactions': true,
  'offline-first-accounts': true,
  'offline-first-categories': true,
  'offline-first-analytics': true,
  'offline-first-sync': true,
})
```

## Expected Behavior

### In Development Mode
1. **Automatic initialization** - Services start automatically when the app loads
2. **UI indicators** - Status indicator appears in bottom-right corner
3. **Developer panel** - Feature flags panel appears in bottom-left corner
4. **Local storage** - Data persists across browser sessions

### Sync Behavior
1. **Queue operations** - All CRDT changes are queued for sync
2. **Background sync** - Attempts sync every 30 seconds when online
3. **Conflict detection** - Compares timestamps and flags conflicts
4. **Graceful degradation** - Works offline, syncs when connection returns

### UI Components
1. **Status indicator** shows:
   - Online/offline status
   - Sync state (synced, syncing, error, conflict)
   - Pending operations count
   - Last sync timestamp
   - Manual sync button

2. **Developer panel** allows:
   - Toggle individual feature flags
   - Enable/disable development mode
   - Reset all flags to defaults

## Error Handling

### Common Issues and Solutions

#### "Failed to initialize sync service"
- **Cause**: Network errors or missing server endpoints
- **Solution**: Expected in development; sync will retry when server is available

#### "CRDT document not initialized"
- **Cause**: Services not initialized in correct order
- **Solution**: Ensure `offlineFirstInitService.initialize()` completes

#### "SQLite WASM failed to load"
- **Cause**: CDN issues loading sql.js
- **Solution**: Check network connection and browser compatibility

### Debug Mode
Enable verbose logging:
```javascript
// Check initialization status
offlineFirstInitService.getStatus()

// Monitor service states
console.log('CRDT ready:', crdtService.getDocument() !== null)
console.log('Sync state:', syncService.getSyncState())
```

## Integration with Existing Code

### Using Adaptive Services
Replace direct server calls with adaptive services:

```javascript
// Before (direct server call)
import { getTransactions } from '@/features/transactions/services/transaction'

// After (adaptive service)
import { adaptiveTransactionService } from '@/core/offline-first'
await adaptiveTransactionService.getTransactions(params)
```

### Checking Offline-First Status
```javascript
import { useOfflineFirst } from '@/core/offline-first'

function MyComponent() {
  const { isInitialized, isUsingOfflineFirst } = useOfflineFirst()
  
  if (!isInitialized) {
    return <LoadingSpinner />
  }
  
  return (
    <div>
      {isUsingOfflineFirst ? 'Using offline-first' : 'Using server mode'}
    </div>
  )
}
```

## Production Considerations

### Performance
- **SQLite indices** are rebuilt on initialization (may take time with large datasets)
- **Sync frequency** can be adjusted (currently 30 seconds)
- **Storage limits** - Browser localStorage has size limits

### Security
- **Local data** is stored unencrypted in browser storage
- **Sync conflicts** may expose data inconsistencies
- **Server endpoints** need proper authentication

### Monitoring
- Check sync status regularly: `syncService.getSyncState()`
- Monitor storage usage
- Track conflict frequency

## Next Steps (Future Phases)

1. **Conflict Resolution UI** - User interface for resolving sync conflicts
2. **Account/Category Services** - Extend offline-first to all data types
3. **Performance Optimization** - Incremental sync, compression
4. **Migration Tools** - Help existing users transition to offline-first
5. **Analytics Integration** - Offline analytics and reporting