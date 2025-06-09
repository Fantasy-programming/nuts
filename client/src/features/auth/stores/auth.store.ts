import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authService } from '../services/auth';
import { userService } from '@/features/preferences/services/user';

import type { AuthNullable } from '../services/auth.types';
import { tryCatch } from '@/lib/trycatch';
import { logger } from '@/lib/logger';


interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: AuthNullable;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  setUser: (user: AuthNullable) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  resetState: () => void;
}

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set,) => ({
        ...initialState,

        // Methods
        setUser: (user) => set({ user }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

        resetState: () => set(initialState),

        login: async (credentials) => {
          set({ isLoading: true, error: null });
          let errorMessage = 'Login failed';
          const { error } = await tryCatch(authService.login(credentials))

          if (error) {
            logger.error(error)
            errorMessage = error.message;
            set({
              error: errorMessage,
              user: null,
              isAuthenticated: false,
              isLoading: false
            });
            throw error
          }

          //TODO: Handle that error too
          const { data: userData } = await tryCatch(userService.getMe())

          if (userData) {
            set({
              user: userData,
              isAuthenticated: true,
              error: null,
              isLoading: false
            });
            return
          }
        },

        logout: async () => {
          try {
            set({ isLoading: true, error: null });
            await authService.logout();

            set({
              user: null,
              isAuthenticated: false,
              isLoading: false
            });
          } catch (err) {
            let errorMessage = 'Logout failed';
            if (err instanceof Error) {
              errorMessage = err.message;
            }
            set({
              error: errorMessage,
              isLoading: false,
              // Still clear user state even if logout API call fails
              user: null,
              isAuthenticated: false,
            });
            throw err;
          }
        },

        refreshAuth: async () => {
          set({ isLoading: true });
          const { error: refreshErr } = await tryCatch(authService.refresh())

          if (refreshErr) {
            logger.error(refreshErr)
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Session expired'
            });
            throw refreshErr
          }

          const { error: userFetchErr, data: userData } = await tryCatch(userService.getMe())

          if (!userData || userFetchErr) {
            logger.error(refreshErr)
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Session expired'
            });
            throw userFetchErr;
          }

          set({
            user: userData,
            isAuthenticated: true,
            error: null,
            isLoading: false
          });
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          // Only persist these fields from state
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);
