import { userService } from '@/features/preferences/services/user';
import { useAuthenticatedQuery } from '@/lib/authed-query';


export const userQueryOptions = () => ({
  queryKey: ['user'],
  queryFn: userService.getMe,
  staleTime: 5 * 60 * 1000,
});

export const useUserQuery = () => {
  return useAuthenticatedQuery(userQueryOptions());
};


// export const useUserQuery = () => {
//   const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
//
//   return useQuery({
//     queryKey: ['user'],
//     queryFn: userService.getMe,
//     enabled: isAuthenticated,
//     staleTime: 5 * 60 * 1000, // 5 minutes
//     retry: false,
//   });
// };
