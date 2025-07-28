/**
 * Drizzle Integration Validation Test
 * 
 * Tests the new Drizzle ORM integration for local-first database operations.
 */

import { localDb, drizzleQueryService } from '../services/drizzle-query.service';
import { crdtService } from '../services/crdt.service';

export async function validateDrizzleIntegration() {
  console.log('🧪 Testing Drizzle ORM integration...');

  try {
    // Initialize services
    await localDb.initialize();
    await drizzleQueryService.initialize();
    await crdtService.initialize();

    // Test database creation and seeding
    console.log('✅ Database initialization successful');

    // Test getting stats
    const stats = await drizzleQueryService.getStats();
    console.log('📊 Database stats:', stats);

    // Test querying transactions (should be empty initially)
    const transactionsResult = await drizzleQueryService.queryTransactions({
      page: 1,
      limit: 10
    });
    console.log('📋 Transactions query result:', {
      count: transactionsResult.data.length,
      pagination: transactionsResult.pagination
    });

    // Test rebuilding from CRDT data
    const mockTransactions = {
      'test-tx-1': {
        id: 'test-tx-1',
        amount: 100,
        type: 'expense' as const,
        account_id: 'test-account-1',
        category_id: 'test-category-1',
        transaction_datetime: new Date().toISOString(),
        description: 'Test transaction',
        is_external: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    };

    const mockAccounts = {
      'test-account-1': {
        id: 'test-account-1',
        name: 'Test Account',
        type: 'checking',
        currency: 'USD',
        balance: 1000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    };

    const mockCategories = {
      'test-category-1': {
        id: 'test-category-1',
        name: 'Test Category',
        color: '#FF0000',
        icon: 'Test',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    };

    await drizzleQueryService.rebuildFromCRDT(mockTransactions, mockAccounts, mockCategories);
    console.log('✅ CRDT rebuild successful');

    // Test querying after rebuild
    const afterRebuild = await drizzleQueryService.queryTransactions({
      page: 1,
      limit: 10
    });
    console.log('📋 After rebuild:', {
      count: afterRebuild.data.length,
      firstTransaction: afterRebuild.data[0]?.id
    });

    // Test getting accounts and categories
    const accounts = await drizzleQueryService.getAccounts();
    const categories = await drizzleQueryService.getCategories();
    
    console.log('📊 Accounts:', accounts.length);
    console.log('📊 Categories:', categories.length);

    console.log('✅ All Drizzle integration tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Drizzle integration test failed:', error);
    return false;
  }
}

// Export for browser console testing
(window as any).validateDrizzleIntegration = validateDrizzleIntegration;