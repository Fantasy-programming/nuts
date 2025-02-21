import { RouterProvider } from "@tanstack/react-router";
import { useAuth } from "./features/auth/hooks/use-auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./features/auth/contexts/auth.provider";
import { router, queryClient } from "./router"

function RouterWrapper() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

export function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RouterWrapper />
      </QueryClientProvider>
    </AuthProvider>
  );
}
