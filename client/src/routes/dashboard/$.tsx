import React, { useState, useEffect, Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router'

import { usePluginStore } from '@/features/plugins/store';
import { loadPluginModule } from '@/features/plugins/loader';
import { getFirstSegment } from '@/lib/utils';

import NotFound from '@/core/components/NotFound';


export const Route = createFileRoute('/dashboard/$')({
  component: RouteComponent,
})


function RouteComponent() {
  const getPluginConfigById = usePluginStore(state => state.getPluginConfigById);
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [notFound, setNotFound] = useState<string | null>(null);

  const params = Route.useParams();
  const id = params._splat


  useEffect(() => {
    // Only run this logic when the component mounts or when id changes
    if (!id) {
      setNotFound('No plugin ID provided');
      return;
    }

    let foundComponent: React.FC | null = null;
    let foundRoute = false;

    async function loadRoute() {
      const plugin = getPluginConfigById(getFirstSegment(id!));

      if (!plugin || !plugin.enabled) {
        setNotFound(`Plugin '${id}' not found or not enabled`);
        return;
      }

      const module = await loadPluginModule(getFirstSegment(id!));

      if (!module) {
        setNotFound('Internal error');
        return;
      }

      for (const route of module.routes) {
        if (id === route.path.substring(1)) {
          foundRoute = true;
          foundComponent = route.component;
          break;
        }


        // Then check subroutes if no main route matched
        if (route.subroutes && !foundComponent) {
          for (const subroute of route.subroutes) {
            if (id === subroute.path.substring(1)) {
              foundRoute = true;
              foundComponent = subroute.component;
              break;
            }
          }
        }

        // If we found a component, break out of the main loop too
        if (foundComponent) break;
      }

      if (!foundRoute) {
        setNotFound(`Route '${id}' not found in plugin '${plugin.name}'`);
      } else {
        setComponent(foundComponent);
      }

    }

    loadRoute()

  }, [id, getPluginConfigById]);

  if (notFound) {
    return <NotFound message={notFound} />;
  }

  // Show a loading state while the component is being loaded
  if (!Component) {
    return <div>Loading plugin component...</div>;
  }

  // Render the found component
  return <Suspense><Component /></Suspense>;
}
