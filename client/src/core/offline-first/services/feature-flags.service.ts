/**
 * Feature Flags Service for Offline-First Migration
 * 
 * Manages feature flags to toggle between server-based and offline-first
 * implementations during the migration process.
 */

type FeatureFlag = 
  | 'offline-first-enabled'
  | 'offline-first-transactions'
  | 'offline-first-accounts'
  | 'offline-first-categories'
  | 'offline-first-preferences'
  | 'offline-first-analytics'
  | 'offline-first-sync'
  | 'fully-offline-mode';

interface FeatureFlagConfig {
  [key: string]: boolean;
}

class FeatureFlagsService {
  private flags: FeatureFlagConfig = {
    // Master switch for offline-first architecture
    'offline-first-enabled': false,
    
    // Feature-specific flags for gradual migration
    'offline-first-transactions': false,
    'offline-first-accounts': false,
    'offline-first-categories': false,
    'offline-first-preferences': false,
    'offline-first-analytics': false,
    'offline-first-sync': false,
    
    // Fully offline mode (no network calls at all)
    'fully-offline-mode': false,
  };
  
  private storageKey = 'nuts-feature-flags';
  
  constructor() {
    this.loadFromStorage();
    this.initializeDefaultsForDevelopment();
  }
  
  /**
   * Initialize development defaults if in development mode
   */
  private initializeDefaultsForDevelopment(): void {
    if (process.env.NODE_ENV === 'development') {
      // Enable offline-first by default in development
      const hasStoredFlags = localStorage.getItem(this.storageKey);
      if (!hasStoredFlags) {
        this.enableDevelopmentMode();
      }
    }
  }
  
  /**
   * Load feature flags from local storage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const storedFlags = JSON.parse(stored);
        this.flags = { ...this.flags, ...storedFlags };
      }
    } catch (error) {
      console.warn('Failed to load feature flags from storage:', error);
    }
  }
  
  /**
   * Save feature flags to local storage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.flags));
    } catch (error) {
      console.warn('Failed to save feature flags to storage:', error);
    }
  }
  
  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flag: FeatureFlag): boolean {
    return this.flags[flag] === true;
  }
  
  /**
   * Enable a feature flag
   */
  enable(flag: FeatureFlag): void {
    this.flags[flag] = true;
    this.saveToStorage();
    console.log(`Feature flag '${flag}' enabled`);
  }
  
  /**
   * Disable a feature flag
   */
  disable(flag: FeatureFlag): void {
    this.flags[flag] = false;
    this.saveToStorage();
    console.log(`Feature flag '${flag}' disabled`);
  }
  
  /**
   * Toggle a feature flag
   */
  toggle(flag: FeatureFlag): boolean {
    const newValue = !this.flags[flag];
    this.flags[flag] = newValue;
    this.saveToStorage();
    console.log(`Feature flag '${flag}' ${newValue ? 'enabled' : 'disabled'}`);
    return newValue;
  }
  
  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlagConfig {
    return { ...this.flags };
  }
  
  /**
   * Set multiple feature flags at once
   */
  setFlags(flags: Partial<FeatureFlagConfig>): void {
    // Filter out undefined values
    const validFlags = Object.fromEntries(
      Object.entries(flags).filter(([, value]) => value !== undefined)
    ) as FeatureFlagConfig;
    
    this.flags = { ...this.flags, ...validFlags };
    this.saveToStorage();
    console.log('Feature flags updated:', validFlags);
  }
  
  /**
   * Check if offline-first is enabled for transactions
   */
  useOfflineFirstTransactions(): boolean {
    return this.isEnabled('offline-first-enabled') && this.isEnabled('offline-first-transactions');
  }
  
  /**
   * Check if offline-first is enabled for accounts
   */
  useOfflineFirstAccounts(): boolean {
    return this.isEnabled('offline-first-enabled') && this.isEnabled('offline-first-accounts');
  }
  
  /**
   * Check if offline-first is enabled for categories
   */
  useOfflineFirstCategories(): boolean {
    return this.isEnabled('offline-first-enabled') && this.isEnabled('offline-first-categories');
  }
  
  /**
   * Check if offline-first is enabled for preferences
   */
  useOfflineFirstPreferences(): boolean {
    return this.isEnabled('offline-first-enabled') && this.isEnabled('offline-first-preferences');
  }

  /**
   * Check if offline-first analytics is enabled
   */
  useOfflineFirstAnalytics(): boolean {
    return this.isEnabled('offline-first-enabled') && this.isEnabled('offline-first-analytics');
  }
  
  /**
   * Check if sync is enabled
   */
  useSyncEnabled(): boolean {
    return this.isEnabled('offline-first-enabled') && this.isEnabled('offline-first-sync');
  }
  
  /**
   * Check if fully offline mode is enabled
   */
  isFullyOfflineModeEnabled(): boolean {
    return this.isEnabled('fully-offline-mode');
  }
  
  /**
   * Enable offline-first mode for development/testing
   */
  enableDevelopmentMode(): void {
    this.setFlags({
      'offline-first-enabled': true,
      'offline-first-transactions': true,
      'offline-first-accounts': true,
      'offline-first-categories': true,
      'offline-first-preferences': true,
      'offline-first-analytics': false, // Keep analytics server-based for now
      'offline-first-sync': false, // Keep sync disabled initially
    });
  }
  
  /**
   * Disable all offline-first features (fallback to server-based)
   */
  disableOfflineFirst(): void {
    this.setFlags({
      'offline-first-enabled': false,
      'offline-first-transactions': false,
      'offline-first-accounts': false,
      'offline-first-categories': false,
      'offline-first-preferences': false,
      'offline-first-analytics': false,
      'offline-first-sync': false,
    });
  }
  
  /**
   * Reset all feature flags to defaults
   */
  reset(): void {
    localStorage.removeItem(this.storageKey);
    this.flags = {
      'offline-first-enabled': false,
      'offline-first-transactions': false,
      'offline-first-accounts': false,
      'offline-first-categories': false,
      'offline-first-preferences': false,
      'offline-first-analytics': false,
      'offline-first-sync': false,
      'fully-offline-mode': false,
    };
    console.log('Feature flags reset to defaults');
  }
}

// Export singleton instance
export const featureFlagsService = new FeatureFlagsService();

// Export type for use in components
export type { FeatureFlag };