import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/core/components/ui/sonner";
import { ThemeProvider } from "@/features/preferences/contexts/theme.provider";
import type { QueryClient } from "@tanstack/react-query";
import { AdaptiveAuthWrapper, AdaptivePreferencesWrapper } from "@/core/offline-first";

interface RouterContext {
  queryClient: QueryClient;
  auth: {
    isAuthenticated: boolean;
  };
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <ThemeProvider defaultTheme="light" storageKey="finance-theme">
        <AdaptiveAuthWrapper>
          <AdaptivePreferencesWrapper>
            <Outlet />
          </AdaptivePreferencesWrapper>
        </AdaptiveAuthWrapper>
        <Toaster />
      </ThemeProvider>
      <ReactQueryDevtools buttonPosition="bottom-left" />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
}
