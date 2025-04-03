import type { DashboardChartModule, DashboardChartModuleConfig } from './types';

const chartManifests = import.meta.glob<DashboardChartModule>(
  './*/index.ts'
);

const chartModules = import.meta.glob<{ default: DashboardChartModule }>(
  "./*/index.ts"
);


// Cache for loaded configs to avoid redundant loads
let availableChartConfigs: DashboardChartModuleConfig[] | null = null;

/**
 * Loads the static configurations of all available chart modules.
 * Useful for populating selection dialogs.
 */
export async function getAvailableChartConfigs(): Promise<DashboardChartModuleConfig[]> {
  if (availableChartConfigs) {
    return availableChartConfigs;
  }

  const configs: DashboardChartModuleConfig[] = [];
  for (const path in chartManifests) {
    try {
      // Eagerly load the module just to get the config
      // Note: This loads the *entire* module initially. If modules become large,
      // consider exporting config separately or using a manifest file.
      // For now, this is simpler.
      const module = await chartManifests[path]();
      if (module?.config) {
        configs.push(module.config);
      }
    } catch (e) {
      console.error(`Failed to load chart config from ${path}:`, e);
    }
  }
  availableChartConfigs = configs.sort((a, b) => a.title.localeCompare(b.title)); // Sort alphabetically
  return availableChartConfigs;
}


/**
 * Dynamically loads the full chart module including the component.
 */
export async function loadChartModule(chartId: string) {
  const path = `./${chartId}/index.ts`;

  if (chartModules[path]) {
    try {
      const moduleLoader = chartModules[path];
      const module = await moduleLoader();
      return module.default.ChartComponent;
    } catch (e) {
      console.error(`Failed to load chart module "${chartId}":`, e);
      return null;
    }
  } else {
    console.error(`Chart module "${chartId}" not found at path ${path}`);
    return null;
  }
}
