import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { router, queryClient } from "./router";
import { FeatureFlagsDeveloperPanel } from "@/core/offline-first/components/FeatureFlagsDeveloperPanel";
import { OfflineStatusIndicator } from "@/core/offline-first/components/OfflineStatusIndicator";
import { OfflineFirstInitializer } from "@/core/offline-first/components/OfflineFirstInitializer";
import { ConflictResolutionIndicator } from "@/core/offline-first/components/ConflictResolutionUI";

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
      <OfflineFirstInitializer>
        <RouterWrapper />
        <FeatureFlagsDeveloperPanel />
        <OfflineStatusIndicator />
        <ConflictResolutionIndicator />
      </OfflineFirstInitializer>
    </QueryClientProvider>
  );
}
