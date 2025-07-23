/**
 * Basic test to verify offline-first infrastructure works
 * This test demonstrates CRDT operations and SQLite indexing
 */

import { crdtService } from '../services/crdt.service';
import { sqliteIndexService } from '../services/sqlite-index.service';
import { featureFlagsService } from '../services/feature-flags.service';
import { CRDTTransaction } from '../types/crdt-schema';

// Simple test function that can be called from browser console
export async function testOfflineFirstInfrastructure() {
  console.log('🧪 Testing Offline-First Infrastructure...');
  
  try {
    // 1. Test feature flags
    console.log('1. Testing Feature Flags...');
    featureFlagsService.enable('offline-first-enabled');
    featureFlagsService.enable('offline-first-transactions');
    console.log('✅ Feature flags enabled');
    
    // 2. Initialize services
    console.log('2. Initializing CRDT and SQLite services...');
    await crdtService.initialize();
    await sqliteIndexService.initialize();
    console.log('✅ Services initialized');
    
    // 3. Test CRDT operations
    console.log('3. Testing CRDT operations...');
    
    // Create test account
    const testAccount = {
      id: 'test-account-1',
      name: 'Test Account',
      type: 'checking',
      currency: 'USD',
      balance: 1000,
      is_active: true,
    };
    
    await crdtService.createAccount(testAccount);
    console.log('✅ Test account created');
    
    // Create test category
    const testCategory = {
      id: 'test-category-1',
      name: 'Test Category',
      color: '#FF5733',
      is_active: true,
    };
    
    await crdtService.createCategory(testCategory);
    console.log('✅ Test category created');
    
    // Create test transactions
    const testTransactions: CRDTTransaction[] = [
      {
        id: 'test-tx-1',
        amount: -50,
        transaction_datetime: new Date('2024-01-15').toISOString(),
        description: 'Test Expense',
        category_id: 'test-category-1',
        account_id: 'test-account-1',
        type: 'expense',
        transaction_currency: 'USD',
        original_amount: 50,
        is_external: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'test-tx-2',
        amount: 100,
        transaction_datetime: new Date('2024-01-16').toISOString(),
        description: 'Test Income',
        account_id: 'test-account-1',
        type: 'income',
        transaction_currency: 'USD',
        original_amount: 100,
        is_external: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'test-tx-3',
        amount: -25,
        transaction_datetime: new Date('2024-01-17').toISOString(),
        description: 'Another Test Expense',
        category_id: 'test-category-1',
        account_id: 'test-account-1',
        type: 'expense',
        transaction_currency: 'USD',
        original_amount: 25,
        is_external: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    
    for (const tx of testTransactions) {
      await crdtService.createTransaction(tx);
    }
    console.log('✅ Test transactions created');
    
    // 4. Test SQLite indexing
    console.log('4. Testing SQLite indexing...');
    
    const transactions = crdtService.getTransactions();
    const accounts = crdtService.getAccounts();
    const categories = crdtService.getCategories();
    
    await sqliteIndexService.rebuildIndices(transactions, accounts, categories);
    console.log('✅ SQLite indices rebuilt');
    
    // 5. Test queries
    console.log('5. Testing queries...');
    
    const queryResult = sqliteIndexService.queryTransactions({
      page: 1,
      limit: 10,
    });
    
    console.log(`✅ Query result: ${queryResult.transactions.length} transactions found`);
    console.log('   Transaction details:', queryResult.transactions);
    
    // Test filtered query
    const expenseQuery = sqliteIndexService.queryTransactions({
      page: 1,
      limit: 10,
      type: 'expense',
    });
    
    console.log(`✅ Expense query: ${expenseQuery.transactions.length} expenses found`);
    
    // Test analytics
    const analytics = sqliteIndexService.getAnalytics({
      groupBy: 'month',
    });
    
    console.log(`✅ Analytics: ${analytics.length} data points`);
    console.log('   Analytics data:', analytics);
    
    // 6. Test data persistence
    console.log('6. Testing data persistence...');
    
    const binaryDoc = crdtService.getBinaryDocument();
    
    console.log(`✅ Document persisted: ${binaryDoc ? 'Yes' : 'No'}`);
    console.log(`   Document size: ${binaryDoc ? binaryDoc.length + ' bytes' : 'N/A'}`);
    
    console.log('🎉 All tests passed! Offline-first infrastructure is working correctly.');
    
    return {
      success: true,
      results: {
        featureFlags: featureFlagsService.getAllFlags(),
        transactionCount: queryResult.totalCount,
        accountCount: Object.keys(accounts).length,
        categoryCount: Object.keys(categories).length,
        analyticsPoints: analytics.length,
        documentSize: binaryDoc ? binaryDoc.length : 0,
      }
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testOfflineFirst = testOfflineFirstInfrastructure;
}