import { createFileRoute } from "@tanstack/react-router";
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/core/components/ui/dialog';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import IconPicker from '@/core/components/icon-picker';
import { useSettingsStore } from "@/features/preferences/stores/settings.store";
import { TagList } from "@/routes/dashboard_/settings/-components/tag-list";


export const Route = createFileRoute("/dashboard_/settings/tags")({
  component: RouteComponent,
});

function RouteComponent() {
  const { addTag } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newTag, setNewTag] = useState({ name: '', icon: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.name && newTag.icon) {
      addTag(newTag);
      setNewTag({ name: '', icon: '' });
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tags</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newTag.name}
                  onChange={(e) =>
                    setNewTag({ ...newTag, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <IconPicker
                  value={newTag.icon}
                  onChange={(icon) => setNewTag({ ...newTag, icon })}
                />
              </div>
              <Button type="submit" className="w-full">
                Create Tag
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <TagList />
    </div>
  );
}
