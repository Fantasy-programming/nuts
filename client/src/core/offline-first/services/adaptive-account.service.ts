/**
 * Adaptive Account Service
 * 
 * This service acts as a proxy that routes requests to either the server-based
 * account service or the offline-first service based on feature flags.
 * This allows for seamless switching between implementations during migration.
 */

import { featureFlagsService } from './feature-flags.service';
import { connectivityService } from './connectivity.service';
import { offlineFirstAccountService } from './offline-account.service';
import * as serverAccountService from '@/features/accounts/services/account';
import { Account, AccountCreate, AccountWTrend, AccountBalanceTimeline } from '@/features/accounts/services/account.types';
import { TellerConnectEnrollment } from 'teller-connect-react';

class AdaptiveAccountService {
  /**
   * Determine if we should use offline-first based on feature flags and connectivity
   */
  private shouldUseOfflineFirst(): boolean {
    // If fully offline mode is enabled, always use offline
    if (featureFlagsService.isFullyOfflineModeEnabled()) {
      return true;
    }

    // If offline-first is disabled, never use offline
    if (!featureFlagsService.useOfflineFirstAccounts()) {
      return false;
    }

    // If we're in fully offline mode (no server access), use offline
    if (connectivityService.isFullyOffline() || !connectivityService.hasServerAccess()) {
      return true;
    }

    // Default to offline-first when feature flag is enabled and we have connectivity
    return true;
  }
  /**
   * Get all accounts using the appropriate service based on feature flags
   */
  async getAccounts(): Promise<Account[]> {
    if (this.shouldUseOfflineFirst()) {
      return offlineFirstAccountService.getAccounts();
    } else {
      return serverAccountService.accountService.getAccounts();
    }
  }
  
  /**
   * Get accounts with trends
   */
  async getAccountsWTrends(): Promise<AccountWTrend[]> {
    if (this.shouldUseOfflineFirst()) {
      return offlineFirstAccountService.getAccountsWTrends();
    } else {
      return serverAccountService.accountService.getAccountsWTrends();
    }
  }
  
  /**
   * Get account balance timeline
   */
  async getAccountsBalanceTimeline(): Promise<AccountBalanceTimeline[]> {
    if (this.shouldUseOfflineFirst()) {
      return offlineFirstAccountService.getAccountsBalanceTimeline();
    } else {
      return serverAccountService.accountService.getAccountsBalanceTimeline();
    }
  }
  
  /**
   * Create a new account
   */
  async createAccount(account: AccountCreate): Promise<Account> {
    if (this.shouldUseOfflineFirst()) {
      return offlineFirstAccountService.createAccount(account);
    } else {
      return serverAccountService.accountService.createAccount(account);
    }
  }
  
  /**
   * Update an existing account
   */
  async updateAccount(params: { id: string; account: AccountCreate }): Promise<Account> {
    if (this.shouldUseOfflineFirst()) {
      return offlineFirstAccountService.updateAccount(params.id, params.account);
    } else {
      return serverAccountService.accountService.updateAccount(params);
    }
  }
  
  /**
   * Delete an account
   */
  async deleteAccount(id: string): Promise<void> {
    if (this.shouldUseOfflineFirst()) {
      return offlineFirstAccountService.deleteAccount(id);
    } else {
      return serverAccountService.accountService.deleteAccount(id);
    }
  }
  
  /**
   * Link Teller account (only available in server mode)
   */
  async linkTellerAccount(payload: TellerConnectEnrollment): Promise<void> {
    if (this.shouldUseOfflineFirst()) {
      throw new Error('External account linking not available in offline mode');
    } else {
      return serverAccountService.accountService.linkTellerAccount(payload);
    }
  }
  
  /**
   * Link Mono account (only available in server mode)
   */
  async linkMonoAccount(payload: { code: string; institution: string; institutionID: string }): Promise<void> {
    if (this.shouldUseOfflineFirst()) {
      throw new Error('External account linking not available in offline mode');
    } else {
      return serverAccountService.accountService.linkMonoAccount(payload);
    }
  }
  
  /**
   * Initialize the appropriate service
   */
  async initialize(): Promise<void> {
    if (this.shouldUseOfflineFirst()) {
      await offlineFirstAccountService.initialize();
      console.log('✅ Adaptive account service initialized with offline-first mode');
    } else {
      console.log('✅ Adaptive account service initialized with server mode');
    }
  }

  /**
   * Check if the service is using offline-first mode
   */
  isUsingOfflineFirst(): boolean {
    return this.shouldUseOfflineFirst();
  }
}

// Export singleton instance
export const adaptiveAccountService = new AdaptiveAccountService();