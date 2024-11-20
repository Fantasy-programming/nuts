import { createContext } from "react";
import type { JWT } from "@/services/auth.types";

export interface AuthContext {
  isLoggedIn: boolean;
  user: { user: JWT | null };
  storeUser: () => void;
  logout: () => void;
}

export const Context = createContext<null | AuthContext>(null);
