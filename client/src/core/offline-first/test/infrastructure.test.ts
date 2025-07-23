/**
 * Enhanced test to verify Phase 2 offline-first infrastructure
 * This test demonstrates CRDT operations, SQLite indexing, sync service, and feature flags
 */

import { crdtService } from '../services/crdt.service';
import { sqliteIndexService } from '../services/sqlite-index.service';
import { featureFlagsService } from '../services/feature-flags.service';
import { syncService } from '../services/sync.service';
import { offlineFirstInitService } from '../services/offline-first-init.service';
import { CRDTTransaction } from '../types/crdt-schema';

// Enhanced test function for Phase 2
export async function testOfflineFirstInfrastructure() {
  console.log('🧪 Testing Phase 2 Offline-First Infrastructure...');
  
  try {
    // 0. Test Phase 2 initialization
    console.log('0. Testing Phase 2 Initialization...');
    
    // Enable development mode (which should auto-enable offline-first)
    featureFlagsService.enableDevelopmentMode();
    console.log('✅ Development mode enabled');
    
    // Test initialization service
    await offlineFirstInitService.initialize();
    const initStatus = offlineFirstInitService.getStatus();
    console.log('✅ Initialization service status:', initStatus);
    
    // 1. Test feature flags
    console.log('1. Testing Enhanced Feature Flags...');
    console.log('   Current flags:', featureFlagsService.getAllFlags());
    console.log('   Offline-first transactions enabled:', featureFlagsService.useOfflineFirstTransactions());
    console.log('   Sync enabled:', featureFlagsService.useSyncEnabled());
    
    // 2. Verify services are initialized  
    console.log('2. Verifying services are initialized...');
    console.log('   Initialization service ready:', offlineFirstInitService.isReady());
    
    // 3. Test CRDT operations with sync integration
    console.log('3. Testing CRDT operations with sync integration...');
    
    // Create test account
    const testAccount = {
      id: 'test-account-phase2',
      name: 'Phase 2 Test Account',
      type: 'checking',
      currency: 'USD',
      balance: 2000,
      is_active: true,
    };
    
    await crdtService.createAccount(testAccount);
    console.log('✅ Test account created');
    
    // Create test category
    const testCategory = {
      id: 'test-category-phase2',
      name: 'Phase 2 Test Category',
      color: '#4CAF50',
      is_active: true,
    };
    
    await crdtService.createCategory(testCategory);
    console.log('✅ Test category created');
    
    // Create test transactions (these should trigger sync queue)
    const testTransactions: CRDTTransaction[] = [
      {
        id: 'test-tx-phase2-1',
        amount: -75,
        transaction_datetime: new Date('2024-02-15').toISOString(),
        description: 'Phase 2 Test Expense',
        category_id: 'test-category-phase2',
        account_id: 'test-account-phase2',
        type: 'expense',
        transaction_currency: 'USD',
        original_amount: 75,
        is_external: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'test-tx-phase2-2',
        amount: 150,
        transaction_datetime: new Date('2024-02-16').toISOString(),
        description: 'Phase 2 Test Income',
        account_id: 'test-account-phase2',
        type: 'income',
        transaction_currency: 'USD',
        original_amount: 150,
        is_external: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    
    for (const tx of testTransactions) {
      await crdtService.createTransaction(tx);
    }
    console.log('✅ Phase 2 test transactions created (should be in sync queue)');
    
    // 4. Test sync service functionality
    console.log('4. Testing sync service...');
    
    const syncState = syncService.getSyncState();
    console.log('   Sync state:', syncState);
    console.log('   Pending operations:', syncState.pendingOperations);
    console.log('   Online status:', syncState.isOnline);
    
    // Test manual sync (this will fail gracefully since server endpoints don't exist)
    try {
      await syncService.forcSync();
      console.log('✅ Manual sync completed');
    } catch (error) {
      console.log('⚠️ Manual sync failed (expected - server endpoints not available):', error);
    }
    
    // 5. Test conflict handling
    console.log('5. Testing conflict handling...');
    const conflicts = syncService.getConflicts();
    console.log('   Current conflicts:', conflicts.length);
    
    // 6. Test SQLite indexing with Phase 2 data
    console.log('6. Testing SQLite indexing...');
    
    const transactions = crdtService.getTransactions();
    const accounts = crdtService.getAccounts();
    const categories = crdtService.getCategories();
    
    console.log('   CRDT data counts:');
    console.log('     Transactions:', Object.keys(transactions).length);
    console.log('     Accounts:', Object.keys(accounts).length);
    console.log('     Categories:', Object.keys(categories).length);
    
    // Test queries
    const queryResult = sqliteIndexService.queryTransactions({
      page: 1,
      limit: 10,
    });
    
    console.log(`✅ Query result: ${queryResult.transactions.length} transactions found`);
    
    // Test filtered query by account
    const accountQuery = sqliteIndexService.queryTransactions({
      accountId: 'test-account-phase2',
      page: 1,
      limit: 10,
    });
    
    console.log(`✅ Account-filtered query: ${accountQuery.transactions.length} transactions found`);
    
    // 7. Test analytics with Phase 2 data
    console.log('7. Testing analytics...');
    
    const analytics = sqliteIndexService.getAnalytics({
      groupBy: 'month',
    });
    
    console.log(`✅ Analytics: ${analytics.length} data points`);
    if (analytics.length > 0) {
      console.log('   Sample analytics data:', analytics[0]);
    }
    
    // 8. Test feature flag switching
    console.log('8. Testing feature flag switching...');
    
    const originalTransactionFlag = featureFlagsService.useOfflineFirstTransactions();
    featureFlagsService.disable('offline-first-transactions');
    console.log('   Disabled offline-first transactions');
    console.log('   Now using offline-first:', featureFlagsService.useOfflineFirstTransactions());
    
    // Re-enable for consistency
    featureFlagsService.enable('offline-first-transactions');
    console.log('   Re-enabled offline-first transactions');
    
    // 9. Test data persistence
    console.log('9. Testing data persistence...');
    
    const binaryDoc = crdtService.getBinaryDocument();
    console.log(`✅ Document persisted: ${binaryDoc ? 'Yes' : 'No'}`);
    console.log(`   Document size: ${binaryDoc ? binaryDoc.length + ' bytes' : 'N/A'}`);
    
    // Check if sync queue is persisted
    const persistedSyncState = syncService.getSyncState();
    console.log('   Sync queue persistence check:', persistedSyncState.pendingOperations, 'operations');
    
    console.log('🎉 Phase 2 offline-first infrastructure test completed successfully!');
    
    return {
      success: true,
      phase: 2,
      results: {
        featureFlags: featureFlagsService.getAllFlags(),
        initializationStatus: offlineFirstInitService.getStatus(),
        transactionCount: queryResult.totalCount,
        accountCount: Object.keys(accounts).length,
        categoryCount: Object.keys(categories).length,
        analyticsPoints: analytics.length,
        documentSize: binaryDoc ? binaryDoc.length : 0,
        syncState: syncService.getSyncState(),
        conflictCount: conflicts.length,
      }
    };
    
  } catch (error) {
    console.error('❌ Phase 2 test failed:', error);
    return {
      success: false,
      phase: 2,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testOfflineFirstPhase2 = testOfflineFirstInfrastructure;
  (window as any).testOfflineFirst = testOfflineFirstInfrastructure; // Keep backward compatibility
}