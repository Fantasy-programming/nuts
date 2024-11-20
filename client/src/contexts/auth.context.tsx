import { createContext } from "react";
import type { AuthResponse, AuthResNullable } from "@/services/auth.types";

export interface AuthContext {
  isLoggedIn: boolean;
  user: AuthResponse | AuthResNullable;
  storeUser: (newJwt: AuthResponse) => void;
  storeJwt: (jwt: string) => void;
  logout: () => void;
}

export const Context = createContext<null | AuthContext>(null);
