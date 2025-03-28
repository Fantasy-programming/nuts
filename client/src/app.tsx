import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { router, queryClient } from "./router";

function RouterWrapper() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  return (
    <RouterProvider
      router={router}
      context={{
        auth: {
          isAuthenticated,
          isLoading
        },
        queryClient
      }}
    />
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterWrapper />
    </QueryClientProvider>
  );
}
