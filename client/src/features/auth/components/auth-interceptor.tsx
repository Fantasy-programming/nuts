import { FC, useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { Spinner } from '@/core/components/ui/spinner';

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
          // Auth check failed
          console.error('Auth check failed:', error);
        } finally {
          setLoading(false)
        }
      }
    };

    checkAuth();
  }, [isAuthenticated, refreshAuth, setLoading, user]);

  // Only show loading state for dashboard routes
  if (isLoading && isDashboardRoute()) {
    return <Spinner />;
  }

  // Render SessionExpired message if needed
  if (isDashboardRoute() && !isLoading && !isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen flex-col">
        <h2 className="text-xl font-semibold mb-2">Session expired</h2>
        <p className="mb-4">Please log in again.</p>
        <button
          onClick={() => {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
