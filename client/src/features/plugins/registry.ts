import { LucideIcon } from 'lucide-react';

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

export interface PluginConfigExternal {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  icon: React.FC | LucideIcon
  routes: PluginRouteConfigExternal[];
  charts: PluginChartConfigExternal[];
  settings: React.FC;
}


export interface PluginRouteConfigExternal {
  path: string;
  label: string;
  icon: React.FC | LucideIcon;
  component: React.FC;
  subroutes?: {
    path: string;
    label: string;
    icon: React.FC | LucideIcon;
    component: React.FC; // Changed from string to match the parent component type
  }[];
}

export interface PluginChartConfigExternal {

  id: string,
  type: string,
  title: string,
  component: React.FC,
  defaultSize: 1 | 2 | 3,
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

export interface PluginEntry {
  default: PluginConfigExternal
}

// Registry to map plugin IDs to their module loaders
const pluginRegistry = new Map<string, () => Promise<PluginEntry>>();

// Register a plugin loader function
export function registerPlugin<T extends PluginEntry>(pluginId: string, importFn: () => Promise<T>) {
  pluginRegistry.set(pluginId, importFn);
}

// Load a plugin by ID
export async function loadPlugin(pluginId: string): Promise<PluginEntry> {
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
