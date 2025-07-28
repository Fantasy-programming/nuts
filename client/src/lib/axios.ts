import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { authService } from "@/features/auth/services/auth";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { config } from "./env"
import { userService } from "@/features/preferences/services/user";
import { connectivityService } from "@/core/offline-first/services/connectivity.service";
import { offlineAuthService } from "@/core/offline-first/services/offline-auth.service";
import { featureFlagsService } from "@/core/offline-first/services/feature-flags.service";

export const api = axios.create({
  baseURL: config.VITE_API_BASE_URL,
  withCredentials: true,
});

api.defaults.headers.common["Content-Type"] = "application/json";

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.map(cb => cb(token));
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const requestUrl = originalRequest?.url || '';

    // If we're in fully offline mode, reject all network requests immediately
    if (featureFlagsService.isFullyOfflineModeEnabled() || !connectivityService.hasServerAccess()) {
      return Promise.reject(new Error('Request blocked: App is in offline mode'));
    }

    // Only attempt refresh if conditions are met
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !requestUrl.includes('/auth/refresh') &&
      !requestUrl.includes('/auth/login')
    ) {

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh(() => {
            resolve(axios(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try offline-first auth refresh if available
        if (featureFlagsService.isEnabled('offline-first-enabled')) {
          await offlineAuthService.refresh();
        } else {
          await authService.refresh();
          const user = await userService.getMe();
          
          // Update store
          useAuthStore.getState().setUser(user);
          useAuthStore.getState().setAuthenticated(true);
        }

        onRefreshed('refreshed'); // Token is handled by httpOnly cookie
        isRefreshing = false;

        return axios(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        
        // Clear auth state using offline-first service if available
        if (featureFlagsService.isEnabled('offline-first-enabled')) {
          await offlineAuthService.logout();
        } else {
          useAuthStore.getState().resetState();
        }

        // Only redirect if we have connectivity
        if (connectivityService.hasServerAccess()) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
