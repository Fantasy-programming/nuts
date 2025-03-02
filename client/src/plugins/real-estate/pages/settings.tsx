import { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Switch } from '@/core/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/core/components/ui/card';
import { toast } from 'sonner';

export function RealEstateSettings() {
  const [appreciationRate, setAppreciationRate] = useState('5');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [currency, setCurrency] = useState('USD');
  const [defaultView, setDefaultView] = useState('overview');

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Configure your real estate plugin preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appreciation-rate">Default Appreciation Rate (%)</Label>
            <Input
              id="appreciation-rate"
              type="number"
              step="0.1"
              value={appreciationRate}
              onChange={(e) => setAppreciationRate(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Used for projections and calculations when not specified
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">US Dollar ($)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
                <SelectItem value="GBP">British Pound (£)</SelectItem>
                <SelectItem value="CAD">Canadian Dollar (C$)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-view">Default View</Label>
            <Select value={defaultView} onValueChange={setDefaultView}>
              <SelectTrigger id="default-view">
                <SelectValue placeholder="Select default view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="properties">Properties</SelectItem>
                <SelectItem value="map">Map</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">Notifications</Label>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave}>Save Settings</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Manage your real estate data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button variant="outline" className="w-full">Export Data</Button>
            <p className="text-sm text-muted-foreground">
              Export all your property data as JSON
            </p>
          </div>

          <div className="space-y-2">
            <Button variant="outline" className="w-full">Import Data</Button>
            <p className="text-sm text-muted-foreground">
              Import property data from a JSON file
            </p>
          </div>

          <div className="space-y-2">
            <Button variant="destructive" className="w-full">Reset All Data</Button>
            <p className="text-sm text-muted-foreground">
              Delete all property data and reset to defaults
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
