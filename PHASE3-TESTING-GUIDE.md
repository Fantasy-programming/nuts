# Phase 3 Manual Testing Guide

## Testing Phase 3 Implementation

Due to SQLite WASM loading restrictions in the current environment, here's how to manually test Phase 3 once deployed:

### 1. Basic Feature Flag Testing

Open browser console and run:

```javascript
// Check Phase 3 services are available
console.log('Account service:', typeof adaptiveAccountService);
console.log('Category service:', typeof adaptiveCategoryService);

// Check feature flags
featureFlagsService.getAllFlags();
featureFlagsService.useOfflineFirstAccounts();
featureFlagsService.useOfflineFirstCategories();
```

### 2. Comprehensive Phase 3 Testing

```javascript
// Run full Phase 3 test suite
await testOfflineFirstPhase3();

// Validate implementation
await validatePhase3();
```

### 3. Account Service Testing

```javascript
// Test account operations
const account = await adaptiveAccountService.createAccount({
  name: 'Test Account',
  type: 'checking',
  currency: 'USD',
  balance: 1000,
  meta: null
});

console.log('Created account:', account);

// Test retrieval
const accounts = await adaptiveAccountService.getAccounts();
console.log('All accounts:', accounts);

// Test update
const updated = await adaptiveAccountService.updateAccount({
  id: account.id,
  account: { ...account, name: 'Updated Test Account' }
});
console.log('Updated account:', updated);
```

### 4. Category Service Testing

```javascript
// Test category operations
const category = await adaptiveCategoryService.createCategory({
  name: 'Test Category',
  parent_id: null,
  is_default: false,
  icon: 'TestIcon',
  color: '#FF0000'
});

console.log('Created category:', category);

// Test retrieval
const categories = await adaptiveCategoryService.getCategories();
console.log('All categories:', categories);

// Test update
const updatedCat = await adaptiveCategoryService.updateCategory(
  category.id, 
  { ...category, name: 'Updated Test Category' }
);
console.log('Updated category:', updatedCat);
```

### 5. Feature Flag Switching

```javascript
// Test service switching
console.log('Before - Accounts offline:', adaptiveAccountService.isUsingOfflineFirst());
console.log('Before - Categories offline:', adaptiveCategoryService.isUsingOfflineFirst());

// Disable offline-first
featureFlagsService.disable('offline-first-accounts');
featureFlagsService.disable('offline-first-categories');

console.log('After - Accounts offline:', adaptiveAccountService.isUsingOfflineFirst());
console.log('After - Categories offline:', adaptiveCategoryService.isUsingOfflineFirst());

// Re-enable
featureFlagsService.enable('offline-first-accounts');
featureFlagsService.enable('offline-first-categories');
```

### 6. Conflict Resolution Testing

```javascript
// Check for conflicts
const conflicts = syncService.getConflicts();
console.log('Current conflicts:', conflicts);

// Test sync state
const syncState = syncService.getSyncState();
console.log('Sync state:', syncState);

// If conflicts exist, test resolution
if (conflicts.length > 0) {
  await syncService.resolveConflict(conflicts[0].id, 'local');
  console.log('Resolved conflict with local version');
}
```

### 7. React Hooks Testing

```javascript
// These would be tested in React components:
// const { isInitialized, isUsingOfflineFirst } = useAdaptiveAccounts();
// const { isInitialized, isUsingOfflineFirst } = useAdaptiveCategories();
```

### Expected Results

When SQLite WASM loads successfully:

1. ✅ All services initialize without errors
2. ✅ Account CRUD operations work in offline mode
3. ✅ Category CRUD operations work in offline mode
4. ✅ Feature flag switching changes service behavior
5. ✅ Conflict resolution UI appears when conflicts exist
6. ✅ React hooks provide proper state management
7. ✅ Developer panel shows Phase 3 services are active

### UI Elements to Verify

1. **Feature Flags Panel** (bottom-left) should show:
   - Offline-first accounts toggle
   - Offline-first categories toggle
   - Current state indicators

2. **Sync Status Indicator** (bottom-right) should show:
   - Connection status
   - Sync state
   - Pending operations count

3. **Conflict Resolution Indicator** should appear when conflicts exist:
   - Animated orange button with conflict count
   - Opens conflict resolution dialog on click
   - Shows side-by-side conflict comparison

### Performance Verification

- Services should initialize quickly (< 2 seconds)
- CRUD operations should be immediate in offline mode
- UI should remain responsive during operations
- Memory usage should remain stable

This testing guide ensures Phase 3 functionality works as designed once the environment supports SQLite WASM loading.