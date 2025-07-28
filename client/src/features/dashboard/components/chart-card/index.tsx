import { createContext, useContext, useState, useMemo, useCallback, memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/core/components/ui/context-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { GripVertical, Lock, Pencil, Trash, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/features/dashboard/stores/dashboard.store";
import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";


export type ChartSize = 1 | 2 | 3;

export interface ChartItem {
  id: string;
  title: string;
  size: ChartSize;
  isLocked: boolean;
  dataKeys: string[];
  colors?: string[];
  stacked?: boolean;
}

type ChartCardContextValue = {
  id: string;
  size: ChartSize;
  isLocked: boolean;
  isDragging: boolean;
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
  setNodeRef: (node: HTMLElement | null) => void;
  handleRename: (newTitle: string) => void;
  handleRemove: () => void;
  handleToggleLock: () => void;
};

const ChartCardContext = createContext<ChartCardContextValue | null>(null);

function useChartCard() {
  const context = useContext(ChartCardContext);
  if (!context) {
    throw new Error("useChartCard must be used within a ChartCard");
  }
  return context;
}

interface ChartCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Unique identifier for the chart */
  id: string;
  /** Size of the chart */
  size: ChartSize;
  /** Whether the chart is draggable */
  isLocked: boolean;
  /** Callback when drag starts */
  onDragStart?: () => void;
  /** Callback when drag ends */
  onDragEnd?: () => void;
  children: React.ReactNode;
}

export function ChartCard({ id, onDragStart, onDragEnd, size, isLocked, className, children, ...props }: ChartCardProps) {

  // Select actions
  const removeChart = useDashboardStore(state => state.removeChart);
  // const updateChartTitle = useDashboardStore(state => state.updateChartTitle);
  const toggleChartLock = useDashboardStore(state => state.toggleChartLock);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: isLocked });

  // Handler functions
  const handleRename = useCallback((newTitle: string) => console.log(newTitle), []);
  const handleRemove = useCallback(() => removeChart(id), [id, removeChart]);
  const handleToggleLock = useCallback(() => toggleChartLock(id), [id, toggleChartLock]);

  const contextValue = useMemo<ChartCardContextValue>(() => ({
    id,
    size,
    isLocked,
    isDragging,
    attributes,
    listeners,
    setNodeRef,
    handleRename,
    handleRemove,
    handleToggleLock,
  }), [
    id, size, isLocked, isDragging, attributes, listeners, setNodeRef,
    handleRename, handleRemove, handleToggleLock
  ]);

  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
  }), [transform, transition]);

  const sizeClasses = useMemo(() => ({
    1: "col-span-2",
    2: "col-span-2",
    3: "col-span-2",
  }), []);

  return (
    <ChartCardContext.Provider value={contextValue}>
      <Card
        ref={setNodeRef}
        style={style}
        className={cn("group relative w-full h-fit",
          "transition-shadow duration-200",
          isDragging && "opacity-50 z-10 shadow-2xl",
          sizeClasses[size],
          className
        )}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        {...props}
      >
        <ChartCardHandle />
        {children}
      </Card>
    </ChartCardContext.Provider>
  );
}

interface ChartCardHeadProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: () => void;
  children: React.ReactNode;
}

export const ChartCardHeader = memo(({ children, className, ref }: ChartCardHeadProps) => {
  const { isDragging } = useChartCard();

  return (
    <CardHeader className={cn(
      "flex flex-row items-center gap-2 space-y-0 py-3 px-4 border-b",
      isDragging && "cursor-grabbing",
      className
    )} ref={ref}>
      {children}
    </CardHeader>
  )
})

ChartCardHeader.displayName = "ChartCardHeader";

export const ChartCardTitle = memo(({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
  return <h3 className={cn("flex-1 font-semibold text-sm", className)} {...props}>{children}</h3>;
});

ChartCardTitle.displayName = "ChartCardTitle";

// ChartCard Content component
export const ChartCardContent = memo(({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { size } = useChartCard();

  // Adjust padding based on chart size
  const sizeClasses = useMemo(() => ({
    1: "p-2 sm:p-3",
    2: "p-2 sm:p-3",
    3: "p-3 sm:p-4",
  }), []);

  // Add minimum height classes based on size - made more compact
  const heightClasses = useMemo(() => ({
    1: "min-h-[150px] sm:min-h-[180px]",
    2: "min-h-[150px] sm:min-h-[180px]",
    3: "min-h-[180px] sm:min-h-[220px]",
  }), []);


  return (
    <CardContent className={cn(
      "overflow-hidden h-full",
      sizeClasses[size],
      heightClasses[size],
      className
    )} {...props}>
      <div className="w-full h-full">
        {children}
      </div>
    </CardContent>
  );
});

ChartCardContent.displayName = "ChartCardContent";

export const ChartCardHandle = memo(() => {
  const { isLocked, attributes, listeners } = useChartCard();

  if (isLocked)
    return (
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <Button variant="ghost" size="icon" className="cursor-not-allowed opacity-50 h-6 w-6 bg-background border border-border shadow-sm" disabled>
          <Lock className="h-3 w-3" />
          <span className="sr-only">Chart Locked</span>
        </Button>
      </div>
    );

  return (
    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
      <Button variant="ghost" size="icon" className="cursor-grab active:cursor-grabbing h-6 w-6 bg-background border border-border shadow-sm hover:bg-accent" {...attributes} {...listeners}>
        <GripVertical className="h-3 w-3" />
        <span className="sr-only">Drag to reorder chart</span>
      </Button>
    </div>
  );
})

ChartCardHandle.displayName = "ChartCardHandle";

interface ChartCardMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  hasContext?: boolean;
  ref?: () => void;
  children: React.ReactNode;
}

export const ChartCardMenu = memo(({ children, ref, hasContext = true }: ChartCardMenuProps) => {
  const { isLocked, handleRename, handleRemove, handleToggleLock } = useChartCard();

  const [newTitle, setNewTitle] = useState("");
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);


  const openRenameDialog = useCallback(() => {
    setIsRenameDialogOpen(true);
  }, []);

  const submitRename = useCallback(() => {
    handleRename(newTitle);
    setIsRenameDialogOpen(false);
    setNewTitle(""); // Reset input
  }, [handleRename, newTitle]);

  const toggleLockFn = useCallback(() => handleToggleLock(), [handleToggleLock]);
  const removeFn = useCallback(() => handleRemove(), [handleRemove]);

  const menuContent = (
    <ContextMenuContent ref={ref}>
      <ContextMenuItem onSelect={openRenameDialog}>
        <Pencil className="mr-2 h-4 w-4" />
        Rename
      </ContextMenuItem>
      <ContextMenuItem onSelect={toggleLockFn}>
        {isLocked ? <><Unlock className="mr-2 h-4 w-4" />Unlock</> : <><Lock className="mr-2 h-4 w-4" />Lock</>}
      </ContextMenuItem>
      <ContextMenuItem className="text-red-600" onSelect={removeFn}>
        <Trash className="mr-2 h-4 w-4" />
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  );

  return (
    <>
      {hasContext ? (
        <ContextMenu>
          <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
          {menuContent}
        </ContextMenu>
      ) : (
        <div>{children}</div> // Render children directly if no context menu needed
      )}

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chart</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new title"
              aria-label="New chart title"
            />
            <Button onClick={submitRename}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
})

ChartCardMenu.displayName = "ChartCardMenu";
