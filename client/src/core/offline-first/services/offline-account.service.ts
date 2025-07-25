/**
 * Offline-First Account Service
 * 
 * Provides the same API as the server-based account service but operates
 * on local CRDT data. This service can be swapped in place of the server
 * service using feature flags.
 */

import { crdtService } from './crdt.service';
import { sqliteIndexService } from './sqlite-index.service';
import { CRDTAccount } from '../types/crdt-schema';
import { Account, AccountCreate, AccountWTrend, AccountBalanceTimeline } from '@/features/accounts/services/account.types';
import { v4 as uuidv4 } from 'uuid';

class OfflineFirstAccountService {
  private isInitialized = false;
  
  /**
   * Initialize the offline-first account service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await crdtService.initialize();
      await sqliteIndexService.initialize();
      
      this.isInitialized = true;
      console.log('Offline-first account service initialized');
    } catch (error) {
      console.error('Failed to initialize offline-first account service:', error);
      throw error;
    }
  }
  
  /**
   * Ensure the service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
  
  /**
   * Get all accounts
   */
  async getAccounts(): Promise<Account[]> {
    await this.ensureInitialized();
    
    try {
      const crdtAccounts = crdtService.getAccounts();
      
      // Convert CRDT accounts to API format
      const accounts = Object.values(crdtAccounts).map(account => 
        this.convertFromCRDTFormat(account)
      );
      
      // Sort by name for consistency
      return accounts.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Failed to get accounts:', error);
      throw error;
    }
  }
  
  /**
   * Get accounts with trends (simplified version)
   * Note: For Phase 3, we'll return basic trend data. 
   * Future phases can implement proper trend calculation.
   */
  async getAccountsWTrends(): Promise<AccountWTrend[]> {
    await this.ensureInitialized();
    
    try {
      const accounts = await this.getAccounts();
      
      // For now, return accounts with zero trend and empty timeseries
      // This can be enhanced in future phases with actual trend calculation
      return accounts.map(account => ({
        ...account,
        trend: 0,
        balance_timeseries: []
      }));
    } catch (error) {
      console.error('Failed to get accounts with trends:', error);
      throw error;
    }
  }
  
  /**
   * Get account balance timeline (simplified version)
   */
  async getAccountsBalanceTimeline(): Promise<AccountBalanceTimeline[]> {
    await this.ensureInitialized();
    
    try {
      // For Phase 3, return empty timeline
      // Future phases can implement proper timeline calculation
      return [];
    } catch (error) {
      console.error('Failed to get account balance timeline:', error);
      throw error;
    }
  }
  
  /**
   * Create a new account
   */
  async createAccount(accountData: AccountCreate): Promise<Account> {
    await this.ensureInitialized();
    
    try {
      const id = uuidv4();
      const crdtAccount = this.convertToCRDTFormat({
        ...accountData,
        id,
        is_external: false,
        updated_at: new Date().toISOString()
      });
      
      await crdtService.createAccount(crdtAccount);
      
      console.log('Created account:', id);
      return this.convertFromCRDTFormat(crdtAccount);
    } catch (error) {
      console.error('Failed to create account:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing account
   */
  async updateAccount(id: string, accountData: AccountCreate): Promise<Account> {
    await this.ensureInitialized();
    
    try {
      const crdtUpdates = this.convertToCRDTFormat({
        ...accountData,
        id,
        is_external: false,
        updated_at: new Date().toISOString()
      });
      
      // Remove the id since we're updating
      const { id: _, ...updates } = crdtUpdates;
      
      await crdtService.updateAccount(id, updates);
      
      // Get the updated account
      const accounts = crdtService.getAccounts();
      const updatedAccount = accounts[id];
      
      if (!updatedAccount) {
        throw new Error(`Account with ID ${id} not found`);
      }
      
      console.log('Updated account:', id);
      return this.convertFromCRDTFormat(updatedAccount);
    } catch (error) {
      console.error('Failed to update account:', error);
      throw error;
    }
  }
  
  /**
   * Delete an account (soft delete)
   */
  async deleteAccount(id: string): Promise<void> {
    await this.ensureInitialized();
    
    try {
      const timestamp = new Date().toISOString();
      await crdtService.updateAccount(id, { 
        deleted_at: timestamp,
        updated_at: timestamp 
      });
      
      console.log('Deleted account:', id);
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    }
  }
  
  /**
   * Link Teller account (not implemented for offline mode)
   */
  async linkTellerAccount(_payload: any): Promise<void> {
    throw new Error('External account linking not available in offline mode');
  }
  
  /**
   * Link Mono account (not implemented for offline mode)
   */
  async linkMonoAccount(_payload: any): Promise<void> {
    throw new Error('External account linking not available in offline mode');
  }
  
  /**
   * Convert CRDT account format to API format
   */
  private convertFromCRDTFormat(crdtAccount: CRDTAccount): Account {
    return {
      id: crdtAccount.id,
      name: crdtAccount.name,
      type: crdtAccount.type as any, // Cast to the expected enum type
      balance: crdtAccount.balance,
      currency: crdtAccount.currency,
      is_external: false, // CRDT accounts are always internal
      updated_at: crdtAccount.updated_at,
      meta: null // CRDT schema doesn't include meta for now
    };
  }
  
  /**
   * Convert API account format to CRDT format
   */
  private convertToCRDTFormat(account: any): CRDTAccount {
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance: account.balance || 0,
      is_active: true,
      created_at: account.created_at || new Date().toISOString(),
      updated_at: account.updated_at || new Date().toISOString()
    };
  }
}

// Export singleton instance
export const offlineFirstAccountService = new OfflineFirstAccountService();