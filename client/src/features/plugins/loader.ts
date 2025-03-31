import { PluginConfigExternal } from './types';

// Dynamically import only index.ts files from all plugins
const pluginModules = import.meta.glob<{ default: PluginConfigExternal }>(
  "./*/index.ts"
);


export async function loadPluginModule(pluginId: string) {
  const path = `./${pluginId}/index.ts`;

  try {
    if (pluginModules[path]) {
      const pathll = await pluginModules[path]()
      return pathll.default
    }
  } catch (e) {
    console.error(`"${pluginId}" could not be found.`, e);
  }

}

