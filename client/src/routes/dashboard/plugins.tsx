import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react';
import { usePluginStore, Plugin } from '@/lib/plugin-system';
import { Button } from '@/core/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/core/components/ui/card';
import { Switch } from '@/core/components/ui/switch';
import { Badge } from '@/core/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/core/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Input } from '@/core/components/ui/input';
import { Search, Download, X, Settings } from 'lucide-react';
import { renderIcon } from '@/core/components/icon-picker';


export const Route = createFileRoute('/dashboard/plugins')({
  component: PluginManager,
})


export function PluginManager() {
  const { plugins, enablePlugin, disablePlugin, removePlugin } = usePluginStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('installed');

  const filteredPlugins = plugins.filter((plugin) =>
    plugin.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTogglePlugin = (id: string, enabled: boolean) => {
    if (enabled) {
      disablePlugin(id);
    } else {
      enablePlugin(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Plugin Manager</h2>
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

      <Tabs defaultValue="installed" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="installed">Installed</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>
        <TabsContent value="installed" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlugins.length > 0 ? (
              filteredPlugins.map((plugin) => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  onToggle={handleTogglePlugin}
                  onRemove={removePlugin}
                />
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
  );
}

function PluginCard({
  plugin,
  onToggle,
  onRemove,
}: {
  plugin: Plugin;
  onToggle: (id: string, enabled: boolean) => void;
  onRemove: (id: string) => void;
}) {
  const [showSettings, setShowSettings] = useState(false);
  // Create a local Icon component variable to ensure proper rendering
  const Icon = plugin.icon;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {renderIcon(Icon, {className: "h-5 w-5"})}
            <CardTitle className="text-lg">{plugin.name}</CardTitle>
          </div>
          <Badge variant={plugin.enabled ? 'default' : 'outline'}>
            {plugin.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
        <CardDescription>{plugin.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Version:</span>
            <span>{plugin.version}</span>
          </div>
          <div className="flex justify-between">
            <span>Author:</span>
            <span>{plugin.author}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={plugin.enabled}
            onCheckedChange={() => onToggle(plugin.id, plugin.enabled)}
          />
          <span className="text-sm">
            {plugin.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <div className="flex gap-2">
          {plugin.settings && (
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{plugin.name} Settings</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  {plugin.settings && <plugin.settings />}
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button
            variant="outline"
            size="icon"
            className="text-red-500 hover:text-red-600"
            onClick={() => onRemove(plugin.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function MarketplaceContent() {
  const { addPlugin, installedPlugins } = usePluginStore();

  // This would typically fetch from an API
  const marketplacePlugins = [
    {
      id: 'real-estate',
      name: 'Real Estate',
      description: 'Track and manage your real estate investments',
      version: '1.0.0',
      author: 'Finance Dashboard Team',
      icon: 'Home',
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      description: 'Track and manage your cryptocurrency investments',
      version: '1.0.0',
      author: 'Finance Dashboard Team',
      icon: 'Bitcoin',
    },
    {
      id: 'stocks',
      name: 'Stock Market',
      description: 'Track and manage your stock market investments',
      version: '1.0.0',
      author: 'Finance Dashboard Team',
      icon: 'TrendingUp',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {marketplacePlugins.map((plugin) => (
        <Card key={plugin.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Use the icon utility to render the icon from string name */}
                       {renderIcon(plugin.icon, {className: "h-5 w-5"})}
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
              disabled={installedPlugins.includes(plugin.id)}
              onClick={() => {
                // In a real app, this would dynamically import the plugin
                if (plugin.id === 'real-estate') {
                  import('@/plugins/real-estate').then((module) => {
                    // Ensure the icon is a component before adding the plugin
                    const pluginData = {...module.realEstatePlugin};
                    if (typeof pluginData.icon === 'string') {
                      pluginData.icon = getIconByName(pluginData.icon);
                    }
                    addPlugin(pluginData);
                  });
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              {installedPlugins.includes(plugin.id) ? 'Installed' : 'Install'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
