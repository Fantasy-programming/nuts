import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/core/components/ui/sonner";
import { ThemeProvider } from "@/features/preferences/contexts/theme.provider";
import type { QueryClient } from "@tanstack/react-query";
import { AuthInterceptor } from "@/features/auth/components/auth-interceptor";

interface RouterContext {
  queryClient: QueryClient;
  auth: {
    isAuthenticated: boolean;
    isLoading: boolean;
  };
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <ThemeProvider defaultTheme="light" storageKey="finance-theme">
        <AuthInterceptor>
          <Outlet />
        </AuthInterceptor>
        <Toaster />
      </ThemeProvider>
      <ReactQueryDevtools buttonPosition="bottom-left" />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
}
