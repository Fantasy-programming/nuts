import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/core/components/ui/sonner";
import { ThemeProvider } from "@/features/preferences/contexts/theme.provider";
import type { QueryClient } from "@tanstack/react-query";
import { AuthInterceptor } from "@/features/auth/components/auth-interceptor";
import { PreferencesProvider } from "@/features/preferences/components/preferences-provider";
import { ErrorBoundary, RouteErrorFallback } from "@/core/components/error-boundary";

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
    <ErrorBoundary fallback={RouteErrorFallback}>
      <ThemeProvider defaultTheme="light" storageKey="finance-theme">
        <AuthInterceptor>
          <PreferencesProvider>
            <Outlet />
          </PreferencesProvider>
        </AuthInterceptor>
        <Toaster />
      </ThemeProvider>
      <ReactQueryDevtools buttonPosition="bottom-left" />
      <TanStackRouterDevtools position="bottom-right" />
    </ErrorBoundary>
  );
}
