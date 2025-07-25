/**
 * Offline-First Auth Interceptor
 * 
 * Handles authentication checks that work in offline mode by using cached auth state
 * when the server is not accessible or when in fully offline mode.
 */

import { FC } from 'react';
import { Button } from '@/core/components/ui/button';
import { featureFlagsService } from '../services/feature-flags.service';
import { connectivityService } from '../services/connectivity.service';
import { offlineAuthService } from '../services/offline-auth.service';
import { useAuthStore } from '@/features/auth/stores/auth.store';

interface OfflineFirstAuthInterceptorProps {
  children: React.ReactNode;
}

export const OfflineFirstAuthInterceptor: FC<OfflineFirstAuthInterceptorProps> = ({ children }) => {
  const authStore = useAuthStore();
  
  const isDashboardRoute = typeof window !== "undefined" &&
    window.location.pathname.startsWith("/dashboard");

  const redirectToLogin = () => {
    if (typeof window === "undefined") return;
    const redirect = encodeURIComponent(window.location.pathname);
    window.location.href = `/login?redirect=${redirect}`;
  };

  // Check authentication based on offline mode
  const shouldUseOfflineFirst = featureFlagsService.isFullyOfflineModeEnabled() || !connectivityService.hasServerAccess();
  
  let isAuthenticated: boolean;
  
  if (shouldUseOfflineFirst) {
    // Use offline auth service for authentication check
    isAuthenticated = offlineAuthService.isAuthenticated();
  } else {
    // Use normal auth store
    isAuthenticated = authStore.isAuthenticated;
  }

  // Only show auth guard for dashboard routes
  if (isDashboardRoute && !isAuthenticated) {
    if (shouldUseOfflineFirst) {
      return (
        <div className="flex flex-col items-center justify-center h-screen">
          <h2 className="text-xl font-semibold mb-2">Offline Mode - Authentication Required</h2>
          <p className="mb-4 text-center">
            You need to authenticate while online first to use the app in offline mode.
          </p>
          <Button onClick={redirectToLogin}>Go to Login</Button>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-screen">
          <h2 className="text-xl font-semibold mb-2">Session expired</h2>
          <p className="mb-4">Please log in again.</p>
          <Button onClick={redirectToLogin}>Go to Login</Button>
        </div>
      );
    }
  }

  return <>{children}</>;
};