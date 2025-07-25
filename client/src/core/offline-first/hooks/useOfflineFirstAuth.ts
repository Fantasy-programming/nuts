/**
 * Offline-First Authentication Hooks
 * 
 * Provides React Query hooks that work offline-first by using cached auth
 * when in fully offline mode or when server is not accessible.
 */

import { useQuery, UseQueryOptions, useSuspenseQuery, UseSuspenseQueryOptions } from '@tanstack/react-query';
import { featureFlagsService } from '../services/feature-flags.service';
import { connectivityService } from '../services/connectivity.service';
import { offlineAuthService } from '../services/offline-auth.service';
import { useAuthStore } from '@/features/auth/stores/auth.store';

/**
 * Offline-first authenticated query hook
 * Uses cached auth data when in fully offline mode or when server is unreachable
 */
export function useOfflineFirstAuthenticatedQuery<T = unknown, E = unknown>(
  options: UseQueryOptions<T, E>
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Check if we should use offline mode
  const shouldUseOfflineFirst = featureFlagsService.isFullyOfflineModeEnabled() || !connectivityService.hasServerAccess();

  if (shouldUseOfflineFirst) {
    // In fully offline mode, disable queries that require server access
    return useQuery({
      ...options,
      enabled: false,
      queryFn: () => {
        console.warn(`Query '${JSON.stringify(options.queryKey)}' disabled in fully offline mode`);
        return Promise.reject(new Error('Query disabled in fully offline mode'));
      }
    });
  }

  // Online mode: use normal authenticated query
  return useQuery({
    ...options,
    enabled: isAuthenticated && (options.enabled !== false),
  });
}

/**
 * Offline-first authenticated suspense query hook
 */
export function useOfflineFirstAuthenticatedSuspenseQuery<T = unknown, E = unknown>(
  options: UseSuspenseQueryOptions<T, E>
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const shouldUseOfflineFirst = featureFlagsService.isFullyOfflineModeEnabled() || !connectivityService.hasServerAccess();

  if (shouldUseOfflineFirst) {
    throw new Error('Suspense queries not available in fully offline mode');
  }

  // For suspense queries, we need to handle auth differently
  if (!isAuthenticated) {
    throw new Error('Not authenticated');
  }

  return useSuspenseQuery(options);
}

/**
 * Hook to check if user is authenticated (works offline)
 */
export function useOfflineFirstAuth() {
  const authStore = useAuthStore();
  const shouldUseOfflineFirst = featureFlagsService.isFullyOfflineModeEnabled() || !connectivityService.hasServerAccess();

  if (shouldUseOfflineFirst) {
    // Use offline auth service for validation
    return {
      isAuthenticated: offlineAuthService.isAuthenticated(),
      user: offlineAuthService.getCurrentUser(),
      isOfflineMode: true
    };
  }

  // Online mode: use normal auth store
  return {
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
    isOfflineMode: false
  };
}

/**
 * Create query options that are offline-first aware
 */
export function createOfflineFirstQueryOptions<T = unknown, E = unknown>(
  options: UseQueryOptions<T, E>
): UseQueryOptions<T, E> {
  return {
    ...options,
    enabled: false, // Will be overridden by useOfflineFirstAuthenticatedQuery
  };
}