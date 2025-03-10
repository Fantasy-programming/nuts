export interface PluginRouteConfig {
  path: string;
  label: string;
  iconName: string;
  componentPath: string;
  subroutes?: {
    path: string;
    label: string;
    componentPath: string;
  }[];
}

export interface PluginChartConfig {
  id: string;
  type: string;
  title: string;
  componentPath: string;
  defaultSize: 1 | 2 | 3;
}

export interface PluginConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  iconName: string;
  enabled: boolean;
  routeConfigs: PluginRouteConfig[];
  chartConfigs: PluginChartConfig[];
  settingsComponentPath?: string;
}

// Registry to map plugin IDs to their module loaders
const pluginRegistry = new Map<string, () => Promise<unknown>>();

// Register a plugin loader function
export function registerPlugin(pluginId: string, importFn: () => Promise<unknown>) {
  pluginRegistry.set(pluginId, importFn);
}

// Load a plugin by ID
export async function loadPlugin(pluginId: string): Promise<unknown> {
  const loader = pluginRegistry.get(pluginId);
  if (!loader) {
    throw new Error(`Plugin ${pluginId} not registered`);
  }
  return loader();
}

// Register known plugins
// Initialize built-in plugins
export function initializeBuiltInPlugins() {
  registerPlugin('real-estate', () => import('@/features/plugins/real-estate'));
}
