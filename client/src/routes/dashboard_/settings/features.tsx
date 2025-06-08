import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { loadPluginModule } from '@/features/plugins/loader';
import { renderIcon } from "@/core/components/icon-picker/index.helper";
import { usePluginStore } from '@/features/plugins/store';

import { Search, Download, X, Settings } from 'lucide-react';
import { Switch } from '@/core/components/ui/switch';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Input } from '@/core/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/core/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/core/components/ui/dialog';
import type { PluginConfig } from '@/features/plugins/types';

export const Route = createFileRoute('/dashboard_/settings/features')({
  component: RouteComponent,
})

export function RouteComponent() {
  const pluginConfigs = usePluginStore(state => state.pluginConfigs);
  const enablePlugin = usePluginStore(state => state.enablePlugin);
  const disablePlugin = usePluginStore(state => state.disablePlugin)
  const removePlugin = usePluginStore(state => state.removePlugin)

  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlugins = useMemo(() =>
    pluginConfigs.filter((plugin) =>
      plugin.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [pluginConfigs, searchTerm]
  );


  const handleTogglePlugin = useCallback((id: string, enabled: boolean) => {
    if (enabled) {
      disablePlugin(id);
    } else {
      enablePlugin(id);
    }
  }, [disablePlugin, enablePlugin]);


  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex w-full items-center justify-between gap-2 px-4">
        </div>
      </header>
      <main className="flex flex-1 overflow-hidden">
        <div className="h-full w-full space-y-8 overflow-y-auto px-6 py-2">
          <div className="space-y-6">
            <div className="flex-col flex md:flex-row  justify-between">
              <h2 className="text-3xl md:py-0 py-4 font-bold tracking-tight">Plugin Manager</h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search plugins..."
                  className="w-[250px] pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Tabs defaultValue="installed">
              <TabsList>
                <TabsTrigger value="installed">Installed</TabsTrigger>
                <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              </TabsList>
              <TabsContent value="installed" className="mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredPlugins.length > 0 ? (
                    filteredPlugins.map((plugin) => (
                      <Suspense
                        fallback={<div>loading</div>}
                        key={plugin.id}
                      >
                        <PluginCard
                          pluginConfig={plugin}
                          onToggle={handleTogglePlugin}
                          onRemove={removePlugin}
                        /></Suspense>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="text-muted-foreground">No plugins found</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="marketplace" className="mt-6">
                <MarketplaceContent />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

    </>
  );
}

const PluginCard = React.memo(({
  pluginConfig,
  onToggle,
  onRemove,
}: {
  pluginConfig: PluginConfig;
  onToggle: (id: string, enabled: boolean) => void;
  onRemove: (id: string) => void;
}) => {
  const [SettingsComponent, setSettingsComponent] = useState<React.FC | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        const module = await loadPluginModule(pluginConfig.id);
        if (isMounted && module?.settings) {
          setSettingsComponent(() => module.settings);
        }
      } catch (error) {
        console.error(`Failed to load settings for plugin ${pluginConfig.id}`, error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [pluginConfig.id]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {renderIcon(pluginConfig.iconName, { className: "h-5 w-5" })}
            <CardTitle className="text-lg">{pluginConfig.name}</CardTitle>
          </div>
          <Badge variant={pluginConfig.enabled ? 'default' : 'outline'}>
            {pluginConfig.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
        <CardDescription>{pluginConfig.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Version:</span>
            <span>{pluginConfig.version}</span>
          </div>
          <div className="flex justify-between">
            <span>Author:</span>
            <span>{pluginConfig.author}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={pluginConfig.enabled}
            onCheckedChange={() => onToggle(pluginConfig.id, pluginConfig.enabled)}
          />
          <span className="text-sm">
            {pluginConfig.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <div className="flex gap-2">
          {!isLoading && SettingsComponent && (
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{pluginConfig.name} Settings</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <SettingsComponent />
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button
            variant="outline"
            size="icon"
            className="text-red-500 hover:text-red-600"
            onClick={() => onRemove(pluginConfig.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
});

function MarketplaceContent() {
  const addPlugin = usePluginStore(state => state.addPlugin);
  const installedPluginIds = usePluginStore(state => state.installedPluginIds)

  // This would typically fetch from an API
  const marketplacePlugins = useMemo(() => [
    {
      id: 'real-estate',
      name: 'Real Estate',
      description: 'Track and manage your real estate investments',
      version: '1.0.0',
      author: 'Finance Dashboard Team',
      iconName: 'Home',
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      description: 'Track and manage your cryptocurrency investments',
      version: '1.0.0',
      author: 'Finance Dashboard Team',
      iconName: 'Bitcoin',
    },
    {
      id: 'stocks',
      name: 'Stock Market',
      description: 'Track and manage your stock market investments',
      version: '1.0.0',
      author: 'Finance Dashboard Team',
      iconName: 'TrendingUp',
    },
  ], []);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {marketplacePlugins.map((plugin) => {
        return (
          <Card key={plugin.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {renderIcon(plugin.iconName, { className: "h-5 w-5" })}
                  <CardTitle className="text-lg">{plugin.name}</CardTitle>
                </div>
                <Badge>v{plugin.version}</Badge>
              </div>
              <CardDescription>{plugin.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                By {plugin.author}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                disabled={installedPluginIds.includes(plugin.id)}
                onClick={() => addPlugin(plugin.id)}
              >
                <Download className="mr-2 h-4 w-4" />
                {installedPluginIds.includes(plugin.id) ? 'Installed' : 'Install'}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}


