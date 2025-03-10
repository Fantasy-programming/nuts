import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PluginConfig, PluginConfigExternal, loadPlugin } from './registry';

interface PluginState {
  pluginConfigs: PluginConfig[];
  installedPluginIds: string[];
  addPlugin: (pluginId: string) => Promise<void>;
  removePlugin: (id: string) => void;
  enablePlugin: (id: string) => void;
  disablePlugin: (id: string) => void;
  getEnabledPluginConfigs: () => PluginConfig[];
  getPluginConfigById: (id: string) => PluginConfig | undefined;
}

export const usePluginStore = create<PluginState>()(
  persist(
    (set, get) => ({
      pluginConfigs: [],
      installedPluginIds: [],

      addPlugin: async (pluginId) => {
        // Check if already installed
        if (get().installedPluginIds.includes(pluginId)) {
          return;
        }

        try {
          // Dynamically load the plugin
          const pluginModule = await loadPlugin(pluginId);
          const pluginInterface = pluginModule.default as PluginConfigExternal;

          if (!pluginInterface) {
            throw new Error(`Plugin ${pluginId} does not export the expected interface`);
          }

          console.log(pluginInterface)
          // Convert from plugin interface to storable config
          const pluginConfig: PluginConfig = {
            id: pluginInterface.id,
            name: pluginInterface.name,
            description: pluginInterface.description,
            version: pluginInterface.version,
            author: pluginInterface.author,
            iconName: pluginInterface.icon.name || 'Plugin',
            enabled: true,
            routeConfigs: pluginInterface.routes.map(route => ({
              path: route.path,
              label: route.label,
              iconName: route.icon.name || 'Route',
              componentPath: `./${pluginId}/pages/${route.component.name.toLowerCase()}.tsx`,
              subroutes: route.subroutes?.map(subroute => ({
                path: subroute.path,
                label: subroute.label,
                componentPath: `./${pluginId}/pages/${subroute.component.name.toLowerCase()}.tsx`,
              })),
            })),
            chartConfigs: pluginInterface.charts.map(chart => ({
              id: chart.id,
              type: chart.type,
              title: chart.title,
              componentPath: `./${pluginId}/components/${chart.component.name.toLowerCase()}`,
              defaultSize: chart.defaultSize,
            })),
            settingsComponentPath: pluginInterface.settings
              ? `./${pluginId}/pages/${pluginInterface.settings.name.toLowerCase()}.tsx`
              : undefined,
          };

          set((state) => ({
            pluginConfigs: [...state.pluginConfigs, pluginConfig],
            installedPluginIds: [...state.installedPluginIds, pluginId],
          }));
        } catch (error) {
          console.error(`Failed to load plugin ${pluginId}:`, error);
        }
      },

      removePlugin: (id) => {
        set((state) => ({
          pluginConfigs: state.pluginConfigs.filter((config) => config.id !== id),
          installedPluginIds: state.installedPluginIds.filter((pluginId) => pluginId !== id),
        }));
      },

      enablePlugin: (id) => {
        set((state) => ({
          pluginConfigs: state.pluginConfigs.map((config) =>
            config.id === id ? { ...config, enabled: true } : config
          ),
        }));
      },

      disablePlugin: (id) => {
        set((state) => ({
          pluginConfigs: state.pluginConfigs.map((config) =>
            config.id === id ? { ...config, enabled: false } : config
          ),
        }));
      },

      getEnabledPluginConfigs: () => {
        return get().pluginConfigs.filter((config) => config.enabled);
      },

      getPluginConfigById: (id) => {
        return get().pluginConfigs.find((config) => config.id === id);
      },
    }),
    {
      name: 'plugin-storage',
    }
  )
);
