import { LoginFormValues } from "./auth.types";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth';
import { userService } from '@/features/preferences/services/user';
import { useAuthStore } from '../stores/auth.store';
import { logger } from '@/lib/logger';


export const useLogin = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser)
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated)

  return useMutation({
    mutationFn: async (credentials: LoginFormValues) => {
      // Login
      await authService.login(credentials);

      // Get user data
      const user = await userService.getMe();
      return user;
    },
    onSuccess: (user) => {
      setUser(user);
      setAuthenticated(true);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      logger.error('Login failed:', { error: error });
      setAuthenticated(false);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const reset = useAuthStore((s) => s.resetState)

  return useMutation({
    mutationFn: async () => {
      await authService.logout();
    },
    onSuccess: () => {
      reset();
      queryClient.clear(); // Clear all cached data
    },
    onError: (error) => {
      logger.error('Logout failed:', { error });
      // Still reset state even if logout fails
      reset();
      queryClient.clear();
    },
  });
};

export const useRefreshAuth = () => {
  const setUser = useAuthStore((s) => s.setUser)
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated)
  const reset = useAuthStore((s) => s.resetState)

  return useMutation({
    mutationFn: async () => {
      await authService.refresh();
      const user = await userService.getMe();
      return user;
    },
    onSuccess: (user) => {
      setUser(user);
      setAuthenticated(true);
    },
    onError: (error) => {
      logger.error('Auth refresh failed:', { error });
      reset();
    },
  });
};
