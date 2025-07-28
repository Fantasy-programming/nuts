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
      {/* Skip links for accessibility */}
      <div className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-primary text-primary-foreground p-2 z-50">
        <a 
          href="#main-content" 
          className="underline"
          onClick={() => {
            const mainContent = document.getElementById('main-content');
            mainContent?.focus();
          }}
        >
          Skip to main content
        </a>
      </div>
      
      <ThemeProvider defaultTheme="light" storageKey="finance-theme">
        <AuthInterceptor>
          <PreferencesProvider>
            {/* Main content wrapper with semantic structure */}
            <div id="main-content" tabIndex={-1} className="focus:outline-none">
              <Outlet />
            </div>
          </PreferencesProvider>
        </AuthInterceptor>
        
        {/* Toast notifications with accessibility */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
          }}
        />
      </ThemeProvider>
      
      {/* Development tools - only show in development */}
      {import.meta.env.DEV && (
        <>
          <ReactQueryDevtools buttonPosition="bottom-left" />
          <TanStackRouterDevtools position="bottom-right" />
        </>
      )}
    </ErrorBoundary>
  );
}
