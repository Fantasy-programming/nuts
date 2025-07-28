/**
 * Adaptive Preferences Service
 * 
 * This service acts as a proxy that routes requests to either the server-based
 * preferences service or the offline-first service based on feature flags.
 * This allows for seamless switching between implementations during migration.
 */

import { featureFlagsService } from './feature-flags.service';
import { connectivityService } from './connectivity.service';
import { offlinePreferencesService } from './offline-preferences.service';
import { preferencesService, type PreferencesResponse } from '@/features/preferences/services/preferences';

class AdaptivePreferencesService {
  /**
   * Determine if we should use offline-first based on feature flags and connectivity
   */
  private shouldUseOfflineFirst = (): boolean => {
    try {
      // If fully offline mode is enabled, always use offline
      if (featureFlagsService?.isFullyOfflineModeEnabled?.()) {
        return true;
      }

      // If offline-first preferences are disabled, never use offline
      if (!featureFlagsService?.isEnabled?.('offline-first-preferences')) {
        return false;
      }

      // If we're in fully offline mode (no server access), use offline
      if (connectivityService?.isFullyOffline?.() || !connectivityService?.hasServerAccess?.()) {
        return true;
      }

      // Default to offline-first when feature flag is enabled and we have connectivity
      return true;
    } catch (error) {
      console.warn('Error in shouldUseOfflineFirst, defaulting to false:', error);
      return false;
    }
  }

  /**
   * Get preferences using the appropriate service based on feature flags
   */
  getPreferences = async (): Promise<PreferencesResponse> => {
    if (this.shouldUseOfflineFirst()) {
      return offlinePreferencesService.getPreferences();
    } else {
      return preferencesService.getPreferences();
    }
  }

  /**
   * Update preferences using the appropriate service based on feature flags
   */
  updatePreferences = async (preferences: Partial<PreferencesResponse>): Promise<PreferencesResponse> => {
    if (this.shouldUseOfflineFirst()) {
      return offlinePreferencesService.updatePreferences(preferences);
    } else {
      return preferencesService.updatePreferences(preferences);
    }
  }

  /**
   * Clear cached preferences (offline mode only)
   */
  clearCache = (): void => {
    offlinePreferencesService.clear();
  }

  /**
   * Check if currently using offline-first mode
   */
  isUsingOfflineFirst = (): boolean => {
    return this.shouldUseOfflineFirst();
  }

  /**
   * Initialize the adaptive preferences service
   */
  initialize = async (): Promise<void> => {
    if (this.shouldUseOfflineFirst()) {
      // No specific initialization needed for offline preferences service
      console.log('✅ Adaptive preferences service initialized with offline-first mode');
    } else {
      console.log('✅ Adaptive preferences service initialized with server mode');
    }
  }
}

// Export singleton instance
export const adaptivePreferencesService = new AdaptivePreferencesService();