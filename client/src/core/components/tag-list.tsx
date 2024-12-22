import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { IconPicker } from '@/core/components/icon-picker';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useSettingsStore } from '@/features/preferences/stores/settings.store';

export function TagList() {
  const { tags, updateTag, deleteTag } = useSettingsStore();
  const [editingTag, setEditingTag] = useState<{
    id: string;
    name: string;
    icon: string;
  } | null>(null);

  const handleUpdate = () => {
    if (editingTag) {
      updateTag(editingTag.id, {
        name: editingTag.name,
        icon: editingTag.icon,
      });
      setEditingTag(null);
    }
  };

  const renderIcon = (iconName: string) => {
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tag</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tags.map((tag) => (
            <TableRow key={tag.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {renderIcon(tag.icon)}
                  {tag.name}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setEditingTag(tag)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => deleteTag(tag.id)}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editingTag?.name ?? ''}
                onChange={(e) =>
                  setEditingTag(editingTag ? { ...editingTag, name: e.target.value } : null)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <IconPicker
                value={editingTag?.icon ?? ''}
                onChange={(icon) =>
                  setEditingTag(editingTag ? { ...editingTag, icon } : null)
                }
              />
            </div>
            <Button onClick={handleUpdate} className="w-full">
              Update Tag
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
