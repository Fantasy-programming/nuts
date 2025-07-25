import { userService } from '@/features/preferences/services/user';
import { useOfflineFirstAuthenticatedQuery } from '@/core/offline-first/hooks/useOfflineFirstAuth';


export const userQueryOptions = () => ({
  queryKey: ['user'],
  queryFn: userService.getMe,
  staleTime: 5 * 60 * 1000,
});

export const useUserQuery = () => {
  return useOfflineFirstAuthenticatedQuery(userQueryOptions());
};
