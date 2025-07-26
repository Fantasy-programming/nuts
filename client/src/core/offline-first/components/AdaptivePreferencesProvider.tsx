/**
 * Adaptive Preferences Provider
 * 
 * Provides preferences data using offline-first architecture when enabled,
 * falling back to server-based implementation when needed.
 */

import { useEffect, ReactNode } from 'react';
import { usePreferencesStore } from '../stores/preferences.store.ts';
import { adaptivePreferencesService } from '@/core/offline-first/services/adaptive-preferences.service';
import { featureFlagsService } from '@/core/offline-first/services/feature-flags.service';
import { connectivityService } from '@/core/offline-first/services/connectivity.service';
import { logger } from '@/lib/logger.ts';
import { parseApiError } from '@/lib/error.ts';
import { useQuery } from '@tanstack/react-query';

interface AdaptivePreferencesProviderProps {
  children: ReactNode;
}

export function AdaptivePreferencesProvider({ children }: AdaptivePreferencesProviderProps) {
  const setLoading = usePreferencesStore((state) => state.setLoading);
  const setError = usePreferencesStore((state) => state.setError);
  const setPreferences = usePreferencesStore(state => state.setPreferences);

  // Determine if we should disable queries in offline mode
  const shouldDisableQuery = () => {
    const isFullyOffline = featureFlagsService.isFullyOfflineModeEnabled();
    const hasNoConnectivity = !connectivityService.hasServerAccess();
    const isOfflineFirst = featureFlagsService.useOfflineFirstPreferences();
    
    // Only disable server queries if we're in fully offline mode
    // Offline-first mode should still work with the adaptive service
    return isFullyOffline && hasNoConnectivity;
  };

  const { data, isLoading, error, isSuccess, isError } = useQuery({
    queryKey: ['preferences', 'adaptive'],
    queryFn: () => adaptivePreferencesService.getPreferences(),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      // Don't retry in fully offline mode
      if (shouldDisableQuery()) {
        return false;
      }
      return failureCount < 1;
    },
    enabled: !shouldDisableQuery(), // Disable the query if in fully offline mode with no connectivity
  });

  useEffect(() => {
    if (isLoading && !isSuccess && !isError) {
      setLoading(true);
    }

    if (isSuccess && data) {
      void setPreferences(data);
    }

    if (isError && error) {
      const parsedErr = parseApiError(error);
      setError(parsedErr.userMessage);

      logger.error(error, {
        component: "AdaptivePreferencesProvider",
        action: "useEffect",
        parsedErrorType: parsedErr.type,
        parsedUserMessage: parsedErr.userMessage,
        validationErrors: parsedErr.validationErrors,
        statusCode: parsedErr.statusCode,
        axiosErrorCode: parsedErr.axiosErrorCode,
        isOfflineFirst: adaptivePreferencesService.isUsingOfflineFirst(),
      });
    }

    if (!isLoading && !isError) {
      setLoading(false);
    }
  }, [isLoading, isSuccess, isError, data, error, setPreferences, setLoading, setError]);

  return <>{children}</>;
}