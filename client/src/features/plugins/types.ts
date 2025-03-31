import { LucideIcon } from 'lucide-react';

export interface PluginRouteConfig {
  path: string;
  label: string;
  iconName: string;
  subroutes?: {
    path: string;
    label: string;
  }[];
}

export interface PluginChartConfig {
  id: string;
  type: string;
  title: string;
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
}

export interface PluginEntry {
  default: PluginConfigExternal
}

