import { FC } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { Button } from '@/core/components/ui/button';

interface AuthInterceptorProps {
  children: React.ReactNode;
}

export const AuthInterceptor: FC<AuthInterceptorProps> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const isDashboardRoute = typeof window !== "undefined" &&
    window.location.pathname.startsWith("/dashboard");

  const redirectToLogin = () => {
    if (typeof window === "undefined") return;
    const redirect = encodeURIComponent(window.location.pathname);
    window.location.href = `/login?redirect=${redirect}`;
  };

  // Only show auth guard for dashboard routes
  if (isDashboardRoute && !isAuthenticated) {
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
