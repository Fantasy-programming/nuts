import { createContext } from "react";
import type { AuthNullable } from "../services/auth.types";


export interface AuthContext {
  user: AuthNullable;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}


export const Context = createContext<AuthContext>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: async () => { },
  logout: async () => { }
});

