import { useState, useEffect, useCallback, PropsWithChildren } from "react";
import { authService } from "@/services/auth";
import { initAPI } from "@/lib/axios";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type {
  AuthResponse,
  AuthResNullable,
  RefreshAuthRes,
} from "@/services/auth.types";
import { Context } from "./auth.context";
import { flushSync } from "react-dom";

const defaultState = { token: "", user: null };
const storageKey = "user";
const refreshEndpoit = "http://localhost:3080/api/auth/refresh";

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthResNullable>(defaultState);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Logout the user
  const logout = useCallback(async () => {
    setLoading(true);

    // logout the user
    sessionStorage.removeItem(storageKey);
    await authService.logout();
    setUser(defaultState);
    setIsLoggedIn(false);

    setLoading(false);
  }, []);

  // Store the user in session storage
  const storeUser = useCallback((newJwt: AuthResponse) => {
    setLoading(true);
    const toStore = JSON.stringify(newJwt);
    sessionStorage.setItem(storageKey, toStore);

    flushSync(() => {
      setUser(newJwt);
      setIsLoggedIn(true);
    });

    setLoading(false);
  }, []);

  // Update the jwt in session storage
  const storeJwt = useCallback((newJwt: string) => {
    setLoading(true);
    const currentUser = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
    const updatedUser = { ...currentUser, jwt: newJwt };
    sessionStorage.setItem(storageKey, JSON.stringify(updatedUser));
    setUser(updatedUser);
    setIsLoggedIn(true);
    setLoading(false);
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch(refreshEndpoit, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to refresh token");

      const data: RefreshAuthRes = await response.json();
      storeJwt(data.token);

      return data.token;
    } catch (error) {
      console.error("Token refresh failed:", error);
      await logout();
    }
  }, [storeJwt, logout]);

  useEffect(() => {
    const storedUser = sessionStorage.getItem(storageKey);

    if (storedUser) {
      try {
        const parsedUser: AuthResponse = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        sessionStorage.removeItem(storageKey);
      }
    }

    // Initialize the API with refreshToken and logout functions
    initAPI(refreshToken, logout);

    setLoading(false);
  }, [logout, refreshToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Context.Provider value={{ user, storeUser, storeJwt, logout, isLoggedIn }}>
      {children}
    </Context.Provider>
  );
};
