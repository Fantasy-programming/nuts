import React from 'react';
import { useParams } from '@tanstack/react-router';
import NotFound from './NotFound';
import { usePluginStore } from '@/lib/plugin-system';

interface PluginComponentProps {
  pluginId?: string;
  subPath?: string;
}

const PluginComponent: React.FC<PluginComponentProps> = ({ pluginId, subPath }) => {
  // If pluginId is not passed directly, get it from the route params
  const params = useParams({ strict: false })
  const { getPluginById } = usePluginStore()
  const id = pluginId || params._splat!!;

  const plugin = getPluginById(id);

  if (!plugin) {
    return <NotFound message={`Plugin '${id}' not found or not enabled`} />;
  }

  let RouteComponent: React.ComponentType | null = null;


  for (const route of plugin.routes) {
    console.log("id: ", id, "route: ", route.path.substring(1))
    if (id === route.path.substring(1)) {
      console.log(route.component)
      RouteComponent = route.component;
      break;
    }

    if (route.subroutes) {
      for (const subroute of route.subroutes) {
        if (id === subroute.path) {
          RouteComponent = subroute.component;
          break;
        }
      }

      if (RouteComponent) break;


    }
  }

  if (!RouteComponent) {
    return <NotFound message={`Route '${id}' not found in plugin '${plugin.name}'`} />;
  }

  // Render the found component
  return <RouteComponent />;
};

export default PluginComponent;
