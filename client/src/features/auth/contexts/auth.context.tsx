import { createContext } from "react";
import type { JWT } from "../services/auth.types";

export interface AuthContext {
  isLoggedIn: boolean;
  user: { user: JWT | null };
  isLoading: boolean;
  error: Error | null;
  storeUser: () => void;
  logout: () => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
}

export const Context = createContext<AuthContext | null>(null);
