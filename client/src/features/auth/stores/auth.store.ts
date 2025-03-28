import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authService } from '../services/auth';
import { userService } from '@/features/preferences/services/user';
import type { AuthNullable } from '../services/auth.types';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthState {
  user: AuthNullable;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
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
          try {
            set({ isLoading: true, error: null });
            await authService.login(credentials);
            const userData = await userService.getMe();
            set({
              user: userData,
              isAuthenticated: true,
              error: null,
              isLoading: false
            });
          } catch (err) {
            let errorMessage = 'Login failed';
            if (err instanceof Error) {
              errorMessage = err.message;
            }
            set({
              error: errorMessage,
              user: null,
              isAuthenticated: false,
              isLoading: false
            });
            throw err;
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
          try {
            set({ isLoading: true });
            await authService.refresh();
            const userData = await userService.getMe();
            set({
              user: userData,
              isAuthenticated: true,
              error: null,
              isLoading: false
            });
            return true;
          } catch (err) {
            console.log(err)
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Session expired'
            });
            return false;
          }
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
