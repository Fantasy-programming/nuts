import { useState, useEffect, createContext, useCallback } from "react";
import { initAPI } from "@/lib/axios";

import authService from "@/services/auth";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { AuthResponse, RefreshAuthRes } from "@/services/auth.types";

export interface AuthProviderProps {
  children: React.ReactNode;
}

export interface AuthContext {
  isLoggedIn: boolean;
  user: AuthResponse;
  storeUser: (newJwt: AuthResponse) => void;
  logout: () => void;
}

const dummy = new Date();

const defaultState = {
  token: "",
  user: {
    updated_at: dummy,
    created_at: dummy,
    email: "",
    id: "",
  },
};

export const Context = createContext<null | AuthContext>(null);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthResponse>(defaultState);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const logout = useCallback(async () => {
    sessionStorage.removeItem("user");
    await authService.logout();
    setUser(defaultState);
    setIsLoggedIn(false);
  }, []);

  const storeUser = useCallback((newJwt: AuthResponse | string) => {
    if (typeof newJwt === "string") {
      const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
      const updatedUser = { ...currentUser, jwt: newJwt };
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsLoggedIn(true);
    } else {
      const toStore = JSON.stringify(newJwt);
      sessionStorage.setItem("user", toStore);
      setUser(newJwt);
      setIsLoggedIn(true);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    const response = await fetch("http://localhost:3080/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) await logout();

    const data: RefreshAuthRes = await response.json();
    storeUser(data.token);

    return data.token;
  }, [storeUser, logout]);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");

    if (storedUser) {
      const parsedUser: AuthResponse = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsLoggedIn(true);
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
    <Context.Provider value={{ user, storeUser, logout, isLoggedIn }}>
      {children}
    </Context.Provider>
  );
};
