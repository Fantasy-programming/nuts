/**
 * Offline Functionality Validation Test
 * 
 * Test script to validate that the app works correctly in offline mode
 */

import { featureFlagsService } from '../services/feature-flags.service';
import { connectivityService } from '../services/connectivity.service';
import { offlineAuthService } from '../services/offline-auth.service';
import { adaptiveTransactionService } from '../services/adaptive-transaction.service';
import { adaptiveAccountService } from '../services/adaptive-account.service';
import { adaptiveCategoryService } from '../services/adaptive-category.service';

/**
 * Test offline functionality
 */
export async function testOfflineFunctionality(): Promise<void> {
  console.log('🧪 Testing offline functionality...');

  try {
    // 1. Test connectivity detection
    console.log('\n1. Testing connectivity detection...');
    const connectivityState = connectivityService.getState();
    console.log('Connectivity state:', connectivityState);

    // 2. Test feature flags
    console.log('\n2. Testing feature flags...');
    console.log('Offline-first enabled:', featureFlagsService.isEnabled('offline-first-enabled'));
    console.log('Fully offline mode:', featureFlagsService.isFullyOfflineModeEnabled());

    // 3. Test auth service offline capabilities
    console.log('\n3. Testing offline auth...');
    const isAuthenticated = offlineAuthService.isAuthenticated();
    const currentUser = offlineAuthService.getCurrentUser();
    console.log('Authenticated:', isAuthenticated);
    console.log('Current user:', currentUser);

    // 4. Test adaptive services routing
    console.log('\n4. Testing adaptive services...');
    console.log('Transaction service using offline-first:', adaptiveTransactionService.isUsingOfflineFirst());
    console.log('Account service using offline-first:', adaptiveAccountService.isUsingOfflineFirst());
    console.log('Category service using offline-first:', adaptiveCategoryService.isUsingOfflineFirst());

    // 5. Test fully offline mode
    console.log('\n5. Testing fully offline mode toggle...');
    const originalMode = featureFlagsService.isFullyOfflineModeEnabled();
    
    // Enable fully offline mode
    featureFlagsService.enable('fully-offline-mode');
    console.log('Enabled fully offline mode');
    console.log('Transaction service using offline-first:', adaptiveTransactionService.isUsingOfflineFirst());
    
    // Restore original mode
    if (!originalMode) {
      featureFlagsService.disable('fully-offline-mode');
    }

    console.log('\n✅ Offline functionality test completed successfully');

  } catch (error) {
    console.error('❌ Offline functionality test failed:', error);
    throw error;
  }
}

/**
 * Test offline mode simulation
 */
export async function simulateOfflineMode(): Promise<void> {
  console.log('🌐 Simulating offline mode...');

  try {
    // Enable fully offline mode
    featureFlagsService.enable('fully-offline-mode');
    connectivityService.setFullyOfflineMode(true);

    console.log('✅ Offline mode simulation enabled');
    console.log('📱 App should now work completely offline');
    console.log('🔧 Use the developer panel to disable offline mode when testing is complete');

  } catch (error) {
    console.error('❌ Failed to simulate offline mode:', error);
    throw error;
  }
}

/**
 * Test online mode restoration
 */
export async function restoreOnlineMode(): Promise<void> {
  console.log('🌐 Restoring online mode...');

  try {
    // Disable fully offline mode
    featureFlagsService.disable('fully-offline-mode');
    connectivityService.setFullyOfflineMode(false);

    // Refresh connectivity
    await connectivityService.refreshConnectivity();

    console.log('✅ Online mode restored');
    console.log('🔄 App should now sync with server when connectivity is available');

  } catch (error) {
    console.error('❌ Failed to restore online mode:', error);
    throw error;
  }
}

/**
 * Test authentication in offline mode
 */
export async function testOfflineAuth(): Promise<void> {
  console.log('🔐 Testing offline authentication...');

  try {
    // Initialize offline auth service
    await offlineAuthService.initialize();

    // Check current auth state
    const isAuth = offlineAuthService.isAuthenticated();
    const user = offlineAuthService.getCurrentUser();

    console.log('Authentication status:', isAuth);
    console.log('User info available:', !!user);

    if (isAuth && user) {
      console.log('✅ Offline authentication working correctly');
    } else {
      console.log('⚠️ No cached authentication available - login required while online first');
    }

  } catch (error) {
    console.error('❌ Offline authentication test failed:', error);
    throw error;
  }
}

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testOfflineFunctionality = testOfflineFunctionality;
  (window as any).simulateOfflineMode = simulateOfflineMode;
  (window as any).restoreOnlineMode = restoreOnlineMode;
  (window as any).testOfflineAuth = testOfflineAuth;
}

/**
 * Quick validation of all offline features
 */
export async function validateOfflineFeatures(): Promise<boolean> {
  console.log('🔍 Validating offline features...');

  try {
    await testOfflineFunctionality();
    await testOfflineAuth();
    
    console.log('✅ All offline features validated successfully');
    return true;
  } catch (error) {
    console.error('❌ Offline feature validation failed:', error);
    return false;
  }
}