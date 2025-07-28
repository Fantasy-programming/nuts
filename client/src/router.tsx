import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";

import { routeTree } from "./routeTree.gen";
import { AxiosError } from "axios";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const Axerror = error as AxiosError

        if (Axerror?.response?.status === 401 || Axerror?.response?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Improved network handling
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Improved error handling for mutations
      retry: (failureCount, error: unknown) => {
        const Axerror = error as AxiosError
        // Don't retry on client errors (4xx)
        if (Axerror?.response?.status && Axerror.response.status >= 400 && Axerror.response.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      networkMode: 'offlineFirst',
    },
  },
});

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!,
  },
  // Improved preloading strategy
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  defaultPreloadGcTime: 5 * 60 * 1000, // 5 minutes
  
  // Enable preloading of viewport routes
  defaultViewTransition: true,
  
  // Improved error handling
  defaultErrorComponent: ({ error }) => (
    <div className="p-4 text-center" role="alert">
      <h2 className="text-lg font-semibold text-destructive mb-2">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {error instanceof Error ? error.message : 'An unexpected error occurred'}
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Reload page
      </button>
    </div>
  ),
  
  // Default pending component for better UX
  defaultPendingComponent: () => (
    <div className="flex items-center justify-center min-h-[200px]" role="status" aria-live="polite">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  ),
});

// Enable hot module replacement for development
if (import.meta.env.DEV && import.meta.hot) {
  import.meta.hot.dispose(() => {
    // Clean up router on hot reload
    queryClient.clear();
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
