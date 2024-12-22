import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/core/components/ui/sonner";
import { ThemeProvider } from "@/features/preferences/contexts/theme.provider";
import type { AuthContext } from "@/features/auth/contexts/auth.context";
import type { QueryClient } from "@tanstack/react-query";

interface RouterContext {
  queryClient: QueryClient;
  auth: AuthContext;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <ThemeProvider defaultTheme="light" storageKey="finance-theme">
        <Outlet />
      </ThemeProvider>
      <Toaster />
      <ReactQueryDevtools buttonPosition="top-right" />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  ),
});
