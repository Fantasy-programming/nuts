import { Navigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "../hooks/use-auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" search={{ returnTo: location.pathname }} replace />;
  }

  return <>{children}</>;
};
