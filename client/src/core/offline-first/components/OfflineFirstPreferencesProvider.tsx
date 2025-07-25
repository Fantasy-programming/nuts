/**
 * Offline-First Preferences Provider
 * 
 * Handles user preferences loading with offline support using cached data
 * when the server is not accessible or when in fully offline mode.
 */

import { useEffect, ReactNode } from 'react';
import { usePreferencesStore } from '@/features/preferences/stores/preferences.store';
import { offlinePreferencesService } from '../services/offline-preferences.service';
import { featureFlagsService } from '../services/feature-flags.service';
import { connectivityService } from '../services/connectivity.service';
import { preferencesService } from '@/features/preferences/services/preferences';
import { logger } from '@/lib/logger';
import { parseApiError } from '@/lib/error';

interface OfflineFirstPreferencesProviderProps {
  children: ReactNode;
}

export function OfflineFirstPreferencesProvider({ children }: OfflineFirstPreferencesProviderProps) {
  const setLoading = usePreferencesStore((state) => state.setLoading);
  const setError = usePreferencesStore((state) => state.setError);
  const setPreferences = usePreferencesStore(state => state.setPreferences);

  useEffect(() => {
    let mounted = true;

    const loadPreferences = async () => {
      try {
        setLoading(true);
        setError(null);

        const shouldUseOfflineFirst = featureFlagsService.isFullyOfflineModeEnabled() || !connectivityService.hasServerAccess();

        let preferences;
        
        if (shouldUseOfflineFirst) {
          console.log('📱 Loading preferences in offline mode...');
          preferences = await offlinePreferencesService.getPreferences();
        } else {
          console.log('🌐 Loading preferences from server...');
          preferences = await preferencesService.getPreferences();
        }

        if (mounted) {
          setPreferences(preferences);
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          const parsedErr = parseApiError(error);
          setError(parsedErr.userMessage);
          setLoading(false);

          logger.error(error, {
            component: "OfflineFirstPreferencesProvider",
            action: "loadPreferences",
            parsedErrorType: parsedErr.type,
            parsedUserMessage: parsedErr.userMessage,
            validationErrors: parsedErr.validationErrors,
            statusCode: parsedErr.statusCode,
            axiosErrorCode: parsedErr.axiosErrorCode,
          });
        }
      }
    };

    // Subscribe to connectivity changes to reload preferences when coming back online
    const unsubscribe = connectivityService.subscribe((state) => {
      if (state.hasServerAccess && !featureFlagsService.isFullyOfflineModeEnabled()) {
        // Reload preferences when server becomes available
        loadPreferences();
      }
    });

    loadPreferences();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [setLoading, setError, setPreferences]);

  return <>{children}</>;
}