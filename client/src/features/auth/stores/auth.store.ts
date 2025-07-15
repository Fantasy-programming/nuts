import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import type { AuthNullable } from '../services/auth.types';


export interface AuthState {
  user: AuthNullable;
  isAuthenticated: boolean;

  setUser: (user: AuthNullable) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  resetState: () => void;
}

const initialState = {
  user: null,
  isAuthenticated: false,
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
          setUser: (user) => setState({ user }, 'auth/setUser'),
          setAuthenticated: (auth) => setState({ isAuthenticated: auth }, 'auth/setAuthenticated'),
          resetState: () => setState({ ...initialState }, 'auth/reset'),

        }
      },
      {
        name: 'auth-storage',
        partialize: ({ isAuthenticated }) => ({ isAuthenticated }),
      }
    )
  )
);
