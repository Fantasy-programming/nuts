import { useState, useEffect, useCallback, useMemo } from "react";
import { authService } from "../services/auth";
import { api as axios } from "@/lib/axios";
import type { AuthNullable } from "../services/auth.types";
import { Context } from "./auth.context";
import { userService } from "@/features/preferences/services/user";

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthNullable>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



  // Setup axios interceptors for token refresh
  useEffect(() => {

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        console.log("error occured too")
        // If unauthorized and not already retried
        if (error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {

            // Attempt to refresh token
            await authService.refresh()

            // Retry original request
            return axios(originalRequest);
          } catch {
            // Refresh failed, logout user
            setUser(null);
            setIsAuthenticated(false);
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);



  // Check authentication on initial load
  useEffect(() => {
    setIsLoading(true);

    const checkAuth = async () => {
      try {
        const user = await userService.getMe();

        setUser(user);
        setIsAuthenticated(true);
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);




  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.login(credentials);
      const user = await userService.getMe();

      setUser(user);
      setIsAuthenticated(true);
    } catch (err: unknown) {

      const errorMessage = err instanceof Error
        ? err.message
        : (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Logout failed';
      setError(errorMessage);
      setUser(null);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error
        ? err.message
        : (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Logout failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);


  // Memoize context value
  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
  }), [user, isAuthenticated, isLoading, error, login, logout]);

  if (isLoading) return null


  return (
    <Context.Provider value={contextValue}>
      {children}
    </Context.Provider>
  );
};
