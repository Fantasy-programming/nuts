import { FC, useEffect, useMemo, useRef } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { Spinner } from '@/core/components/ui/spinner';
import { Button } from '@/core/components/ui/button';
import { logger } from '@/lib/logger';
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

  const triedRefreshRef = useRef(false);

  const isDashboardRoute = useMemo(() => {
    return (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/dashboard")
    );
  }, []);

  const redirectToLogin = () => {
    if (typeof window === "undefined") return;
    const redirect = encodeURIComponent(window.location.pathname);
    window.location.href = `/login?redirect=${redirect}`;
  };


  useEffect(() => {
    if (triedRefreshRef.current) return;
    triedRefreshRef.current = true;

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

  if (isDashboardRoute && isLoading) {
    return <Spinner />;
  }

  if (isDashboardRoute && !isLoading && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-semibold mb-2">Session expired</h2>
        <p className="mb-4">Please log in again.</p>
        <Button onClick={redirectToLogin}>Go to Login</Button>
      </div>
    );
  }

  return <>{children}</>;
};
