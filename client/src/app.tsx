import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { router, queryClient } from "./router";
import { FeatureFlagsDeveloperPanel } from "@/core/offline-first/components/FeatureFlagsDeveloperPanel";

function RouterWrapper() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <RouterProvider
      router={router}
      context={{
        auth: {
          isAuthenticated,
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
      <FeatureFlagsDeveloperPanel />
    </QueryClientProvider>
  );
}
