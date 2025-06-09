import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { authService } from "@/features/auth/services/auth";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { config } from "./env"

export const api = axios.create({
  baseURL: config.VITE_API_BASE_URL,
  withCredentials: true,
});

api.defaults.headers.common["Content-Type"] = "application/json";


// Managing auth token refresh state
const createTokenRefreshManager = () => {
  let isRefreshing = false;
  let refreshPromise: Promise<void> | null = null;

  return {
    isRefreshing: () => isRefreshing,
    setRefreshing: (status: boolean) => { isRefreshing = status; },
    getRefreshPromise: () => refreshPromise,
    setRefreshPromise: (promise: Promise<void> | null) => { refreshPromise = promise; }
  };
};

const tokenRefreshManager = createTokenRefreshManager();


api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const requestUrl = originalRequest?.url || '';


    // Only attempt refresh if conditions are met
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !requestUrl.includes('/auth/refresh') &&
      !requestUrl.includes('/auth/login')
    ) {
      originalRequest._retry = true;

      try {
        // If refresh already in progress, wait for it
        if (tokenRefreshManager.isRefreshing()) {
          const existingPromise = tokenRefreshManager.getRefreshPromise();
          if (existingPromise) {
            await existingPromise;
            return api(originalRequest);
          }
        }

        // Start new refresh
        tokenRefreshManager.setRefreshing(true);
        const refreshPromise = authService.refresh();
        tokenRefreshManager.setRefreshPromise(refreshPromise);

        await refreshPromise;

        // Reset refresh state and retry original request
        tokenRefreshManager.setRefreshing(false);
        tokenRefreshManager.setRefreshPromise(null);

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        tokenRefreshManager.setRefreshing(false);
        tokenRefreshManager.setRefreshPromise(null);

        // Optional: trigger logout in store if refresh fails
        const authStore = useAuthStore.getState();
        await authStore.logout();

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
