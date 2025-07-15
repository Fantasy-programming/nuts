import { useQuery, useSuspenseQuery, UseQueryOptions, UseSuspenseQueryOptions } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/stores/auth.store';

export function useAuthenticatedQuery<T = unknown, E = unknown>(
  options: UseQueryOptions<T, E>
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    ...options,
    enabled: isAuthenticated && (options.enabled !== false),
  });
}

export function useAuthenticatedSuspenseQuery<T = unknown, E = unknown>(
  options: UseSuspenseQueryOptions<T, E>
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // For suspense queries, we need to handle auth differently
  if (!isAuthenticated) {
    throw new Error('Not authenticated');
  }

  return useSuspenseQuery(options);
}

// Query options factory with auth check
export function createAuthenticatedQueryOptions<T = unknown, E = unknown>(
  options: UseQueryOptions<T, E>
): UseQueryOptions<T, E> {
  return {
    ...options,
    enabled: false, // Will be overridden by useAuthenticatedQuery
  };
}
