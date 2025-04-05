import React, { useState, useEffect, Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router'

import { usePluginStore } from '@/features/plugins/store';
import { loadPluginModule } from '@/features/plugins/loader';
import { getFirstSegment } from '@/lib/utils';
import NotFound from '@/core/components/NotFound';
import type { PluginRouteConfigExternal } from '@/features/plugins/types';

export const Route = createFileRoute('/dashboard/$')({
  component: RouteComponent,
})


// Helper function to find the route component recursively
const findComponentForPath = (
  targetPath: string,
  routes: PluginRouteConfigExternal[]
): React.FC | null => {
  for (const route of routes) {

    // Check main route path (removing leading slash if present)
    const routePath = route.path.startsWith('/') ? route.path.substring(1) : route.path;
    if (targetPath === routePath) {
      return route.component;
    }

    // Check subroutes
    if (route.subroutes) {
      const foundSubComponent = findComponentForPath(targetPath, route.subroutes);
      if (foundSubComponent) {
        return foundSubComponent;
      }
    }
  }
  return null;
};





function RouteComponent() {
  const getPluginConfigById = usePluginStore(state => state.getPluginConfigById);
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Add loading state


  const params = Route.useParams();
  const requestedPath = params._splat


  useEffect(() => {

    // Reset state when path changes
    setComponent(null);
    setNotFound(null);
    setIsLoading(true);


    // Only run this logic when the component mounts or when id changes
    if (!requestedPath) {
      setNotFound('No plugin path provided');
      setIsLoading(false);
      return;
    }

    const pluginId = getFirstSegment(requestedPath);

    if (!pluginId) {
      setNotFound('Invalid plugin path format.');
      setIsLoading(false);
      return;
    }

    let isMounted = true; // Prevent state updates on unmounted component


    async function loadRoute() {
      try {
        const plugin = getPluginConfigById(pluginId); // Use memoized selector if applied

        if (!plugin || !plugin.enabled) {
          if (isMounted) setNotFound(`Plugin '${pluginId}' not found or not enabled`);
          return;
        }

        // Load the *external* definition which includes the components
        const module = await loadPluginModule(pluginId);

        if (!module) {
          if (isMounted) setNotFound(`Failed to load module for plugin '${pluginId}'.`);
          return;
        }

        // Find the component using the helper function
        const foundComponent = findComponentForPath(requestedPath ?? "", module.routes);

        if (foundComponent) {
          if (isMounted) setComponent(() => foundComponent); // Use functional update for safety
        } else {
          if (isMounted) setNotFound(`Route '${requestedPath}' not found in plugin '${plugin?.name || pluginId}'`);
        }
      } catch (error) {
        console.error("Error loading plugin route:", error);
        if (isMounted) setNotFound('An error occurred while loading the plugin component.');
      } finally {
        if (isMounted) setIsLoading(false);
      }

    }

    loadRoute()


    // Cleanup function to set isMounted to false when the component unmounts
    // or when the effect re-runs (due to requestedPath change)
    return () => {
      isMounted = false;
    };

  }, [requestedPath, getPluginConfigById]);

  if (isLoading) {
    // Consistent Loading state (consider a shared Skeleton component)
    return <div>Loading plugin component...</div>;
  }

  if (notFound) {
    return <NotFound message={notFound} />;
  }

  if (!Component) {
    // This case should ideally be covered by isLoading or notFound
    return <NotFound message={`Component for path '${requestedPath}' could not be loaded.`} />;
  }

  // Render the found component
  return (
    <Suspense fallback={<div>Loading content...</div>}>
      <Component />
    </Suspense>
  );
}
