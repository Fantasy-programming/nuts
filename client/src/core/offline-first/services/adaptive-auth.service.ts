/**
 * Adaptive Authentication Wrappers
 * 
 * Provides React Query wrappers that automatically disable auth queries
 * when in fully offline mode, routing to cached auth data instead.
 */

import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { featureFlagsService } from './feature-flags.service';
import { offlineAuthService } from './offline-auth.service';
import { connectivityService } from './connectivity.service';

/**
 * Adaptive auth query hook that respects offline-first settings
 */
export function useAdaptiveAuthQuery<TData = unknown, TError = unknown>(
  options: UseQueryOptions<TData, TError> & {
    offlineFallback?: () => TData | null;
  }
): UseQueryResult<TData, TError> {
  const { offlineFallback, ...queryOptions } = options;
  
  return useQuery({
    ...queryOptions,
    enabled: (() => {
      // Disable query if in fully offline mode
      if (featureFlagsService.isEnabled('fully-offline-mode')) {
        console.log('🔒 Auth query disabled - fully offline mode enabled');
        return false;
      }
      
      // Disable query if no server access
      if (!connectivityService.hasServerAccess()) {
        console.log('📡 Auth query disabled - no server connectivity');
        return false;
      }
      
      // Use original enabled condition
      return queryOptions.enabled !== false;
    })(),
    queryFn: async (context) => {
      // In offline mode, use fallback if available
      if (featureFlagsService.isEnabled('fully-offline-mode') || !connectivityService.hasServerAccess()) {
        if (offlineFallback) {
          const fallbackData = offlineFallback();
          if (fallbackData !== null) {
            return fallbackData as TData;
          }
        }
        throw new Error('Query disabled in offline mode');
      }
      
      // Execute original query function
      if (!queryOptions.queryFn) {
        throw new Error('Query function not provided');
      }
      
      return await queryOptions.queryFn(context);
    }
  });
}

/**
 * Auth state query that works offline
 */
export function useOfflineFirstAuth() {
  return useAdaptiveAuthQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      // This would normally call userService.getMe()
      // But we'll use the offline auth service instead
      return offlineAuthService.getCurrentUser();
    },
    offlineFallback: () => offlineAuthService.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry auth errors, they usually need user intervention
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    }
  });
}

/**
 * Authentication status query that works offline
 */
export function useOfflineFirstAuthStatus() {
  return useAdaptiveAuthQuery({
    queryKey: ['auth', 'status'],
    queryFn: async () => {
      return {
        isAuthenticated: offlineAuthService.isAuthenticated(),
        canSync: offlineAuthService.canSync(),
        user: offlineAuthService.getCurrentUser()
      };
    },
    offlineFallback: () => ({
      isAuthenticated: offlineAuthService.isAuthenticated(),
      canSync: false, // Never sync in offline mode
      user: offlineAuthService.getCurrentUser()
    }),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: () => {
      // Refresh more frequently when online, less when offline
      return connectivityService.hasServerAccess() ? 30000 : 300000; // 30s online, 5m offline
    }
  });
}

/**
 * Higher-order component for auth-aware API calls
 */
export class AdaptiveAuthAPI {
  /**
   * Make an authenticated API call that respects offline mode
   */
  static async authenticatedFetch<T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> {
    // In fully offline mode, reject all API calls
    if (featureFlagsService.isEnabled('fully-offline-mode')) {
      throw new Error('API calls disabled in fully offline mode');
    }
    
    // Check connectivity
    if (!connectivityService.hasServerAccess()) {
      throw new Error('No server connectivity available');
    }
    
    // Get access token for the request
    const accessToken = await offlineAuthService.getAccessTokenForSync();
    if (!accessToken) {
      throw new Error('No valid access token available');
    }
    
    // Add auth header
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Make the request
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // Handle auth errors
    if (response.status === 401 || response.status === 403) {
      // Try to refresh token and retry once
      try {
        await offlineAuthService.refresh();
        const newToken = await offlineAuthService.getAccessTokenForSync();
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, { ...options, headers });
          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        }
      } catch (refreshError) {
        console.warn('Token refresh failed during API call:', refreshError);
      }
      
      throw new Error('Authentication failed');
    }
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Check if API calls are allowed in current mode
   */
  static canMakeAPICalls(): boolean {
    return !featureFlagsService.isEnabled('fully-offline-mode') && 
           connectivityService.hasServerAccess() && 
           offlineAuthService.canSync();
  }
}

/**
 * Custom hook for adaptive API calls
 */
export function useAdaptiveAPI() {
  return {
    canMakeAPICalls: AdaptiveAuthAPI.canMakeAPICalls(),
    authenticatedFetch: AdaptiveAuthAPI.authenticatedFetch,
    isOnline: connectivityService.hasServerAccess(),
    isOfflineMode: featureFlagsService.isEnabled('fully-offline-mode'),
    hasValidAuth: offlineAuthService.isAuthenticated()
  };
}