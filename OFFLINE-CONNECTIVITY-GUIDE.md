# Offline-First Connectivity Guide

This guide explains how to test and use the offline-first functionality with proper connectivity handling.

## Overview

The offline-first architecture now includes comprehensive connectivity detection and offline authentication to ensure the app works seamlessly when there's no network connectivity.

## Key Features

### 1. Connectivity Detection
- **Real-time connectivity monitoring**: Automatically detects network status and server accessibility
- **Periodic server checks**: Regularly verifies server connectivity every 30 seconds
- **Smart routing**: Adaptive services automatically route to offline or server implementations

### 2. Offline Authentication
- **Cached credentials**: Authentication state is cached for 24 hours
- **Offline validation**: App can validate authentication without server calls
- **Graceful degradation**: Handles auth refresh failures when offline

### 3. Fully Offline Mode
- **Force offline operation**: New feature flag to disable all network calls
- **Complete isolation**: App works entirely from local storage
- **Testing mode**: Perfect for testing offline functionality

## Testing Offline Functionality

### Method 1: Using Feature Flags (Recommended)

1. **Open Developer Tools** (F12)
2. **Enable offline mode** via console:
   ```javascript
   // Enable fully offline mode
   featureFlagsService.enable('fully-offline-mode');
   
   // Test offline functionality
   await testOfflineFunctionality();
   ```

3. **Use the app normally** - all operations will use offline storage
4. **Disable when done**:
   ```javascript
   featureFlagsService.disable('fully-offline-mode');
   ```

### Method 2: Network Simulation

1. **Enable offline-first features** first
2. **Disconnect network** (turn off WiFi, disconnect ethernet)
3. **Shutdown local server** (if running)
4. **Test app functionality** - should continue working

### Method 3: Developer Panel

1. **Look for "Feature Flags" panel** in bottom-left corner (development only)
2. **Toggle "Fully Offline Mode"** switch
3. **Test app functionality**
4. **Toggle back when done**

## Testing Scenarios

### Scenario 1: Complete Offline Operation
```javascript
// 1. Enable offline mode
await simulateOfflineMode();

// 2. Test basic operations
const transactions = await adaptiveTransactionService.getTransactions({});
const accounts = await adaptiveAccountService.getAccounts();
const categories = await adaptiveCategoryService.getCategories();

// 3. Test CRUD operations
const newTransaction = await adaptiveTransactionService.createTransaction({
  description: 'Offline test transaction',
  amount: 100,
  date: new Date()
});

// 4. Restore online mode
await restoreOnlineMode();
```

### Scenario 2: Authentication in Offline Mode
```javascript
// Test offline auth functionality
await testOfflineAuth();

// Check auth status
const isAuthenticated = offlineAuthService.isAuthenticated();
const user = offlineAuthService.getCurrentUser();

console.log('Authenticated:', isAuthenticated);
console.log('User:', user);
```

### Scenario 3: Connectivity State Monitoring
```javascript
// Monitor connectivity changes
connectivityService.subscribe((state) => {
  console.log('Connectivity changed:', state);
});

// Check current state
const state = connectivityService.getState();
console.log('Current connectivity:', state);

// Force connectivity check
await connectivityService.refreshConnectivity();
```

## Expected Behavior

### When Online
- ✅ All features work normally
- ✅ Data syncs with server
- ✅ Authentication refresh works
- ✅ Real-time server connectivity detection

### When Offline (No Network)
- ✅ App continues to work with local data
- ✅ Authentication uses cached credentials (24h validity)
- ✅ All CRUD operations work with offline storage
- ✅ No error messages or crashes

### When Server Down (Network Available)
- ✅ App detects server unavailability
- ✅ Automatically switches to offline mode
- ✅ Returns to server mode when server comes back
- ✅ Queues changes for sync when server returns

### When Fully Offline Mode Enabled
- ✅ All network requests are blocked
- ✅ 100% offline operation guaranteed
- ✅ Perfect for testing and development

## Troubleshooting

### App Shows "Offline-First Initialization Failed"
1. **Check browser console** for detailed error messages
2. **Clear browser storage** and retry:
   ```javascript
   // Clear all offline-first data
   await offlineFirstInitService.clear();
   
   // Reload page
   window.location.reload();
   ```

### Authentication Issues When Offline
1. **Login while online first** to cache credentials
2. **Check cache validity**:
   ```javascript
   const isExpiring = offlineAuthService.isAuthCacheExpiringSoon();
   console.log('Auth cache expiring soon:', isExpiring);
   ```

### Services Not Using Offline Mode
1. **Check feature flags**:
   ```javascript
   console.log('Feature flags:', featureFlagsService.getAllFlags());
   ```
2. **Enable offline-first features**:
   ```javascript
   featureFlagsService.enableDevelopmentMode();
   ```

### Connectivity Detection Issues
1. **Check connectivity state**:
   ```javascript
   console.log('Connectivity:', connectivityService.getState());
   ```
2. **Force connectivity refresh**:
   ```javascript
   await connectivityService.refreshConnectivity();
   ```

## Developer Commands

All commands are available in the browser console:

```javascript
// Quick validation of all offline features
await validateOfflineFeatures();

// Test specific functionality
await testOfflineFunctionality();
await testOfflineAuth();

// Simulate offline/online modes
await simulateOfflineMode();
await restoreOnlineMode();

// Monitor connectivity
connectivityService.subscribe(state => console.log('Connectivity:', state));

// Check service routing
console.log('Using offline-first:');
console.log('- Transactions:', adaptiveTransactionService.isUsingOfflineFirst());
console.log('- Accounts:', adaptiveAccountService.isUsingOfflineFirst());
console.log('- Categories:', adaptiveCategoryService.isUsingOfflineFirst());
```

## Feature Flags Reference

| Flag | Purpose |
|------|---------|
| `offline-first-enabled` | Master switch for offline-first architecture |
| `offline-first-transactions` | Use offline storage for transactions |
| `offline-first-accounts` | Use offline storage for accounts |
| `offline-first-categories` | Use offline storage for categories |
| `offline-first-sync` | Enable background sync with server |
| `fully-offline-mode` | Force complete offline operation (no network calls) |

## Implementation Notes

- **Authentication cache** expires after 24 hours
- **Connectivity checks** run every 30 seconds  
- **Server connectivity** is verified via `/auth/sessions` endpoint
- **Offline data** persists in IndexedDB and localStorage
- **Sync queue** stores pending changes for server sync
- **Feature flags** are persisted in localStorage

This implementation ensures the app works reliably in all connectivity scenarios while maintaining data consistency and user experience.