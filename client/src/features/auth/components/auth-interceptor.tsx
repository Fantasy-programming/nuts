import { FC, useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { Spinner } from '@/core/components/ui/spinner';
import { logger } from '@/lib/logger';
import { Button } from '@/core/components/ui/button';
import { parseApiError } from '@/lib/error';

interface AuthInterceptorProps {
  children: React.ReactNode;
}

export const AuthInterceptor: FC<AuthInterceptorProps> = ({ children }) => {
  const {
    isAuthenticated,
    isLoading,
    setLoading,
    refreshAuth,
    user
  } = useAuthStore();

  // Helper to check if current path is in protected dashboard routes
  const isDashboardRoute = (): boolean => {
    return typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard');
  };


  // Effect for initial auth check
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated && !user) {
        try {
          setLoading(true);
          await refreshAuth();
        } catch (error) {
          const parsedErr = parseApiError(error)

          logger.error(error, {
            component: "AuthInterceptor",
            action: "checkAuth",
            parsedErrorType: parsedErr.type,
            parsedUserMessage: parsedErr.userMessage,
            validationErrors: parsedErr.validationErrors,
            statusCode: parsedErr.statusCode,
            axiosErrorCode: parsedErr.axiosErrorCode,
          });

        } finally {
          setLoading(false)
        }
      }
    };

    checkAuth();
  }, [isAuthenticated, refreshAuth, setLoading, user]);

  // TODO: Only show loading state for dashboard routes (modify with animated stuff)
  if (isLoading && isDashboardRoute()) {
    return <Spinner />;
  }

  // Render SessionExpired message if needed
  if (isDashboardRoute() && !isLoading && !isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen flex-col">
        <h2 className="text-xl font-semibold mb-2">Session expired</h2>
        <p className="mb-4">Please log in again.</p>
        <Button
          onClick={() => {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
          }}
        >
          Go to Login
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};
