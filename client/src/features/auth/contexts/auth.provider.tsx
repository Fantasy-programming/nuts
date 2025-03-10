import { useState, useEffect, useCallback, useMemo } from "react";
import { authService } from "../services/auth";
import { api as axios } from "@/lib/axios";
import type { AuthNullable } from "../services/auth.types";
import { Context } from "./auth.context";
import { userService } from "@/features/preferences/services/user";
import { AxiosError, AxiosRequestConfig } from "axios";

// Define proper types for error responses
interface ApiErrorResponse {
  message?: string;
}

// Define credentials type
interface LoginCredentials {
  email: string;
  password: string;
}

// Define interceptor state type
interface RefreshState {
  isInProgress: boolean;
  promise: Promise<unknown> | null;
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // Auth state
  const [user, setUser] = useState<AuthNullable>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Start with false for instant rendering
  const [error, setError] = useState<string | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  // Helper to check if current path is in protected dashboard routes
  const isDashboardRoute = useCallback((): boolean => {
    return typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard');
  }, []);


  // Handle authentication failure consistently
  const handleAuthFailure = useCallback((shouldShowFallback = true) => {
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);

    // Only show fallback on dashboard routes
    if (shouldShowFallback && isDashboardRoute()) {
      setShowFallback(true);
    }
  }, [isDashboardRoute]);

  // This effect runs on mount to set up interceptors
  useEffect(() => {
    const refreshState: RefreshState = {
      isInProgress: false,
      promise: null
    };

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        const requestUrl = originalRequest?.url || '';

        // Only attempt refresh if conditions are met
        if (
          error.response?.status === 401 &&
          !refreshFailed &&
          !originalRequest._retry &&
          !requestUrl.includes('/api/auth/refresh')
        ) {
          originalRequest._retry = true;

          try {
            // If refresh already in progress, wait for it
            if (refreshState.isInProgress && refreshState.promise) {
              await refreshState.promise;
              return axios(originalRequest);
            }

            // Start new refresh
            refreshState.isInProgress = true;
            refreshState.promise = authService.refresh();

            await refreshState.promise;
            refreshState.isInProgress = false;
            refreshState.promise = null;

            // Retry original request
            return axios(originalRequest);
          } catch (refreshError) {
            // Mark refresh as failed
            setRefreshFailed(true);
            refreshState.isInProgress = false;
            refreshState.promise = null;

            // Only show fallback on dashboard routes
            handleAuthFailure(isDashboardRoute());
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, [refreshFailed, handleAuthFailure, isDashboardRoute]);

  // This effect handles background authentication check without blocking rendering
  useEffect(() => {
    const checkAuth = async () => {
      // If not on a protected route, don't block with loading state
      const shouldBlockWithLoading = isDashboardRoute();

      if (shouldBlockWithLoading) {
        setIsLoading(true);
      }

      try {
        // Check if we already know refresh failed
        if (refreshFailed) {
          handleAuthFailure(isDashboardRoute());
          return;
        }

        const user = await userService.getMe();
        setUser(user);
        setIsAuthenticated(true);
      } catch (error) {
        // Check if this is a 401 error
        const axiosError = error as AxiosError;
        if (axiosError?.response?.status === 401) {
          setRefreshFailed(true);
        }

        handleAuthFailure(isDashboardRoute());
      } finally {
        setIsLoading(false);
      }
    };

    // Start auth check immediately
    checkAuth();

    // Very short timeout for dashboard routes to prevent flickering
    // but still show loading state if auth check takes too long
    const LOADING_TIMEOUT_MS = 400; // Much shorter timeout

    if (isDashboardRoute()) {
      const timer = setTimeout(() => {
        if (!isAuthenticated) {
          setShowFallback(true);
        }
        setIsLoading(false);
      }, LOADING_TIMEOUT_MS);

      return () => clearTimeout(timer);
    }
  }, [refreshFailed, handleAuthFailure, isDashboardRoute, isAuthenticated]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    setRefreshFailed(false);
    setShowFallback(false);

    try {
      await authService.login(credentials);
      const user = await userService.getMe();
      setUser(user);
      setIsAuthenticated(true);
    } catch (err) {
      let errorMessage = 'Login failed';

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object') {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }

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
      setIsAuthenticated(false);
      setRefreshFailed(true);
    } catch (err) {
      let errorMessage = 'Logout failed';

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object') {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }

      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // UI Components
  const FallbackComponent = () => (
    <div className="flex justify-center items-center h-screen flex-col">
      <h2 className="text-xl font-semibold mb-2">Session expired</h2>
      <p className="mb-4">Please log in again.</p>
      <button
        onClick={() => {
          window.location.href = '/login';
          setShowFallback(false);
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Go to Login
      </button>
    </div>
  );

  const LoadingComponent = () => (
    <div className="flex justify-center items-center h-screen">
      Loading...
    </div>
  );

  // Memoize context value
  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
  }), [user, isAuthenticated, isLoading, error, login, logout]);

  // Render appropriate content based on conditions
  const renderContent = () => {
    // Only show loading or fallback on dashboard routes
    if (isDashboardRoute()) {
      if (isLoading) return <LoadingComponent />;
      if (showFallback) return <FallbackComponent />;
    }

    // For non-dashboard routes, render children immediately without loading state
    return children;
  };

  return (
    <Context.Provider value={contextValue}>
      {renderContent()}
    </Context.Provider>
  );
};
