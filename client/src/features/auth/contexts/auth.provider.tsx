import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { authService } from "../services/auth";
import { api as axios } from "@/lib/axios";
import type { AuthNullable } from "../services/auth.types";
import { Context } from "./auth.context";
import { userService } from "@/features/preferences/services/user";
import { AxiosError, AxiosRequestConfig } from "axios";
import { Spinner } from "@/core/components/ui/spinner";

// Define proper types for error responses
interface ApiErrorResponse {
  message?: string;
}

// Define credentials type
interface LoginCredentials {
  email: string;
  password: string;
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // Auth state
  const [user, setUser] = useState<AuthNullable>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start with true to prevent flash
  const [error, setError] = useState<string | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  // Use a ref for tracking refresh state to prevent race conditions
  const refreshStateRef = useRef({
    isInProgress: false,
    promise: null as Promise<unknown> | null
  });

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
    // Clear any previous interceptors to prevent duplicates
    // axios.interceptors.response.eject(axios.interceptors.response?.handlers[0]);

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
          !requestUrl.includes('/api/auth/refresh') &&
          !requestUrl.includes('/auth/refresh')
        ) {
          originalRequest._retry = true;

          try {
            // If refresh already in progress, wait for it
            if (refreshStateRef.current.isInProgress && refreshStateRef.current.promise) {
              await refreshStateRef.current.promise;
              return axios(originalRequest);
            }

            // Start new refresh
            refreshStateRef.current.isInProgress = true;
            refreshStateRef.current.promise = authService.refresh();

            await refreshStateRef.current.promise;
            refreshStateRef.current.isInProgress = false;
            refreshStateRef.current.promise = null;

            // Retry original request
            return axios(originalRequest);
          } catch (refreshError) {
            // Mark refresh as failed
            setRefreshFailed(true);
            refreshStateRef.current.isInProgress = false;
            refreshStateRef.current.promise = null;

            // Handle auth failure appropriately
            handleAuthFailure(isDashboardRoute());
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [refreshFailed, handleAuthFailure, isDashboardRoute]);

  // This effect handles background authentication check without blocking rendering
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        // Don't bother checking if we already know refresh failed
        if (refreshFailed) {
          handleAuthFailure(isDashboardRoute());
          return;
        }

        const userData = await userService.getMe();

        if (isMounted) {
          setUser(userData);
          setIsAuthenticated(true);
          setError(null);
        }
      } catch (error) {
        if (!isMounted) return;

        // Check if this is a 401 error
        const axiosError = error as AxiosError;
        if (axiosError?.response?.status === 401) {
          // Try to refresh the token once before failing
          try {
            await authService.refresh();
            // If refresh succeeds, try getting user data again
            const userData = await userService.getMe();

            if (isMounted) {
              setUser(userData);
              setIsAuthenticated(true);
              setError(null);
            }
            return;
          } catch (e) {
            console.error(e)
            // Refresh also failed, mark as failed
            if (isMounted) {
              setRefreshFailed(true);
            }
          }
        }

        if (isMounted) {
          handleAuthFailure(isDashboardRoute());
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Start auth check immediately
    checkAuth();

    // Very short timeout for dashboard routes to prevent flickering
    // but still show loading state if auth check takes too long
    const LOADING_TIMEOUT_MS = 1000; // Increased timeout for more reliable behavior

    let timer: NodeJS.Timeout;

    if (isDashboardRoute()) {
      timer = setTimeout(() => {
        if (isMounted && !isAuthenticated) {
          setShowFallback(true);
          setIsLoading(false);
        }
      }, LOADING_TIMEOUT_MS);
    }

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [refreshFailed, handleAuthFailure, isDashboardRoute, isAuthenticated]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    setRefreshFailed(false);
    setShowFallback(false);

    try {
      await authService.login(credentials);
      const userData = await userService.getMe();
      setUser(userData);
      setIsAuthenticated(true);
      setError(null);
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

      // Still clear user state even if logout API call fails
      setUser(null);
      setIsAuthenticated(false);

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
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
          setShowFallback(false);
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Go to Login
      </button>
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
      if (isLoading) return <Spinner />;
      if (showFallback) return <FallbackComponent />;
    }

    // For non-dashboard routes, render children immediately
    return children;
  };

  return (
    <Context.Provider value={contextValue}>
      {renderContent()}
    </Context.Provider>
  );
};
