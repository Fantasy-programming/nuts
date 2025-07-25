/**
 * Offline-First Preferences Service
 * 
 * Handles user preferences with offline caching and fallback support.
 */

import { connectivityService } from './connectivity.service';
import { featureFlagsService } from './feature-flags.service';
import { preferencesService } from '@/features/preferences/services/preferences';
import type { UserPreferences } from '@/features/preferences/services/preferences.types';

class OfflinePreferencesService {
  private readonly STORAGE_KEY = 'nuts-offline-preferences';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get preferences with offline fallback
   */
  async getPreferences(): Promise<UserPreferences> {
    const shouldUseOfflineFirst = featureFlagsService.isFullyOfflineModeEnabled() || !connectivityService.hasServerAccess();

    if (shouldUseOfflineFirst) {
      // Use cached preferences in offline mode
      const cachedPrefs = this.getCachedPreferences();
      if (cachedPrefs && this.isCacheValid(cachedPrefs)) {
        console.log('📱 Using cached preferences (offline mode)');
        return cachedPrefs.data;
      } else {
        // Return default preferences if no valid cache
        console.warn('No valid cached preferences, using defaults');
        return this.getDefaultPreferences();
      }
    }

    // Online mode: fetch from server and cache
    try {
      const preferences = await preferencesService.getPreferences();
      this.cachePreferences(preferences);
      return preferences;
    } catch (error) {
      console.warn('Failed to fetch preferences from server, using cache:', error);
      const cachedPrefs = this.getCachedPreferences();
      if (cachedPrefs) {
        return cachedPrefs.data;
      }
      throw error;
    }
  }

  /**
   * Update preferences with offline queueing
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const shouldUseOfflineFirst = featureFlagsService.isFullyOfflineModeEnabled() || !connectivityService.hasServerAccess();

    if (shouldUseOfflineFirst) {
      // In offline mode, merge with cached preferences
      const current = await this.getPreferences();
      const updated = { ...current, ...preferences };
      this.cachePreferences(updated);
      
      // TODO: Queue for sync when back online
      console.log('📱 Preferences updated locally (offline mode)');
      return updated;
    }

    // Online mode: update on server
    try {
      const updated = await preferencesService.updatePreferences(preferences);
      this.cachePreferences(updated);
      return updated;
    } catch (error) {
      console.warn('Failed to update preferences on server:', error);
      throw error;
    }
  }

  /**
   * Cache preferences data
   */
  private cachePreferences(preferences: UserPreferences): void {
    try {
      const cached = {
        data: preferences,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_DURATION
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cached));
    } catch (error) {
      console.warn('Failed to cache preferences:', error);
    }
  }

  /**
   * Get cached preferences
   */
  private getCachedPreferences(): { data: UserPreferences; timestamp: number; expiresAt: number } | null {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Failed to load cached preferences:', error);
      return null;
    }
  }

  /**
   * Check if cached preferences are still valid
   */
  private isCacheValid(cached: { expiresAt: number }): boolean {
    return Date.now() < cached.expiresAt;
  }

  /**
   * Get default preferences for offline mode
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      // Basic defaults that allow the app to function offline
      currency: 'USD',
      language: 'en',
      theme: 'system',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      // Add other default preferences as needed
    } as UserPreferences;
  }

  /**
   * Clear cached preferences
   */
  clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear cached preferences:', error);
    }
  }
}

// Export singleton instance
export const offlinePreferencesService = new OfflinePreferencesService();