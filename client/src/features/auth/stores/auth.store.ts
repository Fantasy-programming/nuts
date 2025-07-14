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
      (set,) => {
        const setState = (
          partial: Partial<AuthState>,
          label: string,
        ) => set(partial as AuthState, false, label)


        return {
          ...initialState,

          // Methods
          setUser: (user) => setState({ user }, 'auth/setUser'),
          setLoading: (isLoading) => setState({ isLoading }, 'auth/setLoading'),
          setError: (error) => setState({ error }, 'auth/setError'),
          setAuthenticated: (auth) => setState({ isAuthenticated: auth }, 'auth/setAuthenticated'),

          resetState: () => setState({ ...initialState }, 'auth/reset'),

          login: async (creds) => {
            setState({ isLoading: true, error: null }, 'auth/loginStart')
            const { error: loginErr } = await tryCatch(authService.login(creds))

            if (loginErr) {
              logger.error(loginErr)
              setState({ error: loginErr.message, isLoading: false }, 'auth/loginError')
              throw loginErr
            }

            const { data: user, error: meErr } = await tryCatch(userService.getMe())

            if (!user || meErr) {
              logger.error(meErr)
              setState({ error: 'Unable to fetch user', isLoading: false }, 'auth/loginFetchError')
              throw meErr ?? new Error('Unable to fetch user')
            }

            setState({ user, isAuthenticated: true, isLoading: false }, 'auth/loginSuccess')
          },

          logout: async () => {
            setState({ isLoading: true, error: null }, 'auth/logoutStart')
            const { error: logoutErr } = await tryCatch(authService.logout())

            if (logoutErr) {
              logger.error(logoutErr)
              setState({ ...initialState, error: logoutErr.message }, 'auth/logoutError')
              throw logoutErr;
            }

            setState({ ...initialState }, 'auth/logoutReset')
          },

          refreshAuth: async () => {
            setState({ isLoading: true }, 'auth/refreshStart')
            const { error: refreshErr } = await tryCatch(authService.refresh())

            if (refreshErr) {
              logger.error(refreshErr)
              setState({ ...initialState, error: 'Session expired' }, 'auth/refreshFail')
              throw refreshErr
            }

            const { data: user, error: userErr } = await tryCatch(userService.getMe())
            if (!user || userErr) {
              logger.error(userErr)
              setState({ ...initialState, error: 'Session expired' }, 'auth/refreshFail')
              throw userErr ?? new Error('Session expired')
            }

            setState({ user, isAuthenticated: true, isLoading: false }, 'auth/refreshSuccess')
          },
        }
      },
      {
        name: 'auth-storage',
        partialize: ({ isAuthenticated }) => ({ isAuthenticated }),
      }
    )
  )
);
