import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/core/components/ui/dialog";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Switch } from "@/core/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/components/ui/table";
import { Badge } from "@/core/components/ui/badge";

import { createFileRoute } from "@tanstack/react-router";
import { useSettingsStore } from "@/features/preferences/stores/settings.store";

export const Route = createFileRoute("/dashboard_/settings/webhooks")({
  component: RouteComponent,
});

const availableEvents = [
  "transaction.created",
  "transaction.updated",
  "transaction.deleted",
  "category.created",
  "category.updated",
  "category.deleted",
  "account.created",
  "account.updated",
  "account.deleted",
];

function RouteComponent() {
  const { webhooks, addWebhook, updateWebhook, deleteWebhook } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    url: "",
    events: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWebhook.url && newWebhook.events.length > 0) {
      addWebhook(newWebhook);
      setNewWebhook({ url: "", events: [] });
      setIsOpen(false);
    }
  };

  const toggleEvent = (event: string) => {
    setNewWebhook((prev) => ({
      ...prev,
      events: prev.events.includes(event) ? prev.events.filter((e) => e !== event) : [...prev.events, event],
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>Manage webhook endpoints for real-time event notifications</CardDescription>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Webhook
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Webhook</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">Webhook URL</Label>
                    <Input
                      id="url"
                      type="url"
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                      placeholder="https://api.example.com/webhook"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Events</Label>
                    <div className="grid gap-2">
                      {availableEvents.map((event) => (
                        <div key={event} className="flex items-center justify-between">
                          <span className="text-sm">{event}</span>
                          <Switch checked={newWebhook.events.includes(event)} onCheckedChange={() => toggleEvent(event)} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    Add Webhook
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell className="font-medium">{webhook.url}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="secondary">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch checked={webhook.active} onCheckedChange={(checked) => updateWebhook(webhook.id, { active: checked })} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => deleteWebhook(webhook.id)}>
                      <Plus className="h-4 w-4 rotate-45" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
