import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DivideIcon as LucideIcon } from 'lucide-react';

export interface PluginRoute {
  path: string;
  label: string;
  icon: typeof LucideIcon;
  component: React.ComponentType;
  subroutes?: {
    path: string;
    label: string;
    component: React.ComponentType;
  }[];
}

export interface PluginChart {
  id: string;
  type: string;
  title: string;
  component: React.ComponentType;
  defaultSize: 1 | 2 | 3;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  icon: typeof LucideIcon;
  enabled: boolean;
  routes: PluginRoute[];
  charts: PluginChart[];
  settings?: React.ComponentType;
}

export type PluginInterface = Omit<Plugin, "enabled">

interface PluginState {
  plugins: Plugin[];
  installedPlugins: string[];
  addPlugin: (plugin: Omit<Plugin, 'enabled'>) => void;
  removePlugin: (id: string) => void;
  enablePlugin: (id: string) => void;
  disablePlugin: (id: string) => void;
  getEnabledPlugins: () => Plugin[];
  getPluginById: (id: string) => Plugin | undefined;
}

export const usePluginStore = create<PluginState>()(
  persist(
    (set, get) => ({
      plugins: [],
      installedPlugins: [],
      addPlugin: (plugin) => {
        set((state) => {
          // Check if plugin already exists
          if (state.plugins.some((p) => p.id === plugin.id)) {
            return state;
          }
          return {
            plugins: [...state.plugins, { ...plugin, enabled: true }],
            installedPlugins: [...state.installedPlugins, plugin.id],
          };
        });
      },
      removePlugin: (id) => {
        set((state) => ({
          plugins: state.plugins.filter((plugin) => plugin.id !== id),
          installedPlugins: state.installedPlugins.filter((pluginId) => pluginId !== id),
        }));
      },
      enablePlugin: (id) => {
        set((state) => ({
          plugins: state.plugins.map((plugin) =>
            plugin.id === id ? { ...plugin, enabled: true } : plugin
          ),
        }));
      },
      disablePlugin: (id) => {
        set((state) => ({
          plugins: state.plugins.map((plugin) =>
            plugin.id === id ? { ...plugin, enabled: false } : plugin
          ),
        }));
      },
      getEnabledPlugins: () => {
        return get().plugins.filter((plugin) => plugin.enabled);
      },
      getPluginById: (id) => {
        return get().plugins.find((plugin) => plugin.id === id);
      },
    }),
    {
      name: 'plugin-storage',
    }
  )
);
