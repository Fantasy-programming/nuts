import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/core/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/core/components/ui/dialog';
import { GripVertical, Lock, Maximize2, Minimize2, Pencil, Trash, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useDashboardStore } from '@/features/dashboard/stores/dashboard.store';

interface ChartCardProps {
  id: string;
  title: string;
  size: 1 | 2 | 3;
  isLocked: boolean;
  children: React.ReactNode;
}

export function ChartCard({ id, title, size, isLocked, children }: ChartCardProps) {
  const { removeChart, updateChartTitle, updateChartSize, toggleChartLock } = useDashboardStore();
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isLocked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleRename = () => {
    updateChartTitle(id, newTitle);
    setIsEditing(false);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative w-full',
        isDragging && 'opacity-50',
        size === 2 && 'md:col-span-2',
        size === 3 && 'md:col-span-3'
      )}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <CardHeader className="flex flex-row items-center gap-2">
            {!isLocked && (
              <Button
                variant="ghost"
                size="icon"
                className="cursor-grab active:cursor-grabbing"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </Button>
            )}
            {isLocked && (
              <Button
                variant="ghost"
                size="icon"
                className="cursor-not-allowed"
              >
                <Lock className="h-4 w-4" />
              </Button>
            )}
            <CardTitle className="flex-1">{title}</CardTitle>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <ContextMenuItem>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </ContextMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rename Chart</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter new title"
                />
                <DialogClose asChild>
                  <Button onClick={handleRename}>Save</Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Maximize2 className="mr-2 h-4 w-4" />
              Resize
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem onClick={() => updateChartSize(id, 1)}>
                <Minimize2 className="mr-2 h-4 w-4" />
                Normal
              </ContextMenuItem>
              <ContextMenuItem onClick={() => updateChartSize(id, 2)}>
                <Maximize2 className="mr-2 h-4 w-4" />
                Wide
              </ContextMenuItem>
              <ContextMenuItem onClick={() => updateChartSize(id, 3)}>
                <Maximize2 className="mr-2 h-4 w-4" />
                Full Width
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuItem onClick={() => toggleChartLock(id)}>
            {isLocked ? (
              <>
                <Unlock className="mr-2 h-4 w-4" />
                Unlock
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Lock
              </>
            )}
          </ContextMenuItem>
          <ContextMenuItem
            className="text-red-600"
            onClick={() => removeChart(id)}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </Card>
  );
}
