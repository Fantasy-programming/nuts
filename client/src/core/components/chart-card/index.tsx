import { createContext, useContext, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/core/components/ui/context-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/core/components/ui/dialog";
import { GripVertical, Lock, Maximize2, Minimize2, Pencil, Trash, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/features/dashboard/stores/dashboard.store";
import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { ChartConfig, ChartDataPoint, Chart } from "./chart-renderer";

export type ChartSize = 1 | 2 | 3;

// Store format for chart data
export interface ChartItem {
  id: string;
  title: string;
  type: ChartConfig["type"];
  size: ChartSize;
  isLocked: boolean;
  dataKeys: string[];
  colors?: string[];
  stacked?: boolean;
  data: ChartDataPoint[];
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
  handleResize: (size: 1 | 2 | 3) => void;
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
  const removeChart = useDashboardStore(state => state.removeChart);
  const updateChartTitle = useDashboardStore(state => state.updateChartTitle);
  const updateChartSize = useDashboardStore(state => state.updateChartSize);
  const toggleChartLock = useDashboardStore(state => state.toggleChartLock);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: isLocked });

  const contextValue: ChartCardContextValue = {
    id,
    size,
    isLocked,
    isDragging,
    attributes,
    listeners,
    setNodeRef,
    handleRename: (newTitle) => {
      updateChartTitle(id, newTitle);
    },
    handleRemove: () => removeChart(id),
    handleResize: (size) => updateChartSize(id, size),
    handleToggleLock: () => toggleChartLock(id),
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Apply appropriate sizing classes based on the size prop
  const sizeClasses = {
    1: "",
    2: "md:col-span-2",
    3: "md:col-span-3 lg:col-span-3",
  };

  return (
    <ChartCardContext.Provider value={contextValue}>
      <Card
        ref={setNodeRef}
        style={style}
        className={cn("group relative w-full h-full col-span-1",
          isDragging && "opacity-50 z-10",
          sizeClasses[size],
          className)}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        {...props}
      >
        {children}
      </Card>
    </ChartCardContext.Provider>
  );
}

interface ChartCardHeadProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: () => void;
  children: React.ReactNode;
}

export function ChartCardHeader({ children, ref }: ChartCardHeadProps) {
  const { isDragging } = useChartCard();
  return <CardHeader className={cn("flex flex-row items-center gap-2", isDragging && "cursor-grabbing")} ref={ref}>{children}</CardHeader>;
}


export function ChartCardTitle({ children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="flex-1 font-medium">{children}</div>;
}

// ChartCard Content component
export const ChartCardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { size } = useChartCard();

  // Adjust padding based on chart size
  const sizeClasses = {
    1: "p-2",
    2: "p-3",
    3: "p-4",
  };

  // Add minimum height classes based on size
  const heightClasses = {
    1: "min-h-[240px]", // Minimum height for size 1
    2: "min-h-[240px]", // Minimum height for size 2
    3: "min-h-[280px]", // Minimum height for size 3
  };


  return (
    <CardContent className={cn(sizeClasses[size], heightClasses[size], "overflow-hidden h-full", className)} {...props}>
      <div className="w-full h-full">
        {children}
      </div>
    </CardContent>
  );
};
ChartCardContent.displayName = "ChartCardContent";

export function ChartCardHandle() {
  const { isLocked, attributes, listeners } = useChartCard();

  if (isLocked)
    return (
      <Button variant="ghost" size="icon" className="cursor-not-allowed">
        <Lock className="h-4 w-4" />
      </Button>
    );

  return (
    <Button variant="ghost" size="icon" className="cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
      <GripVertical className="h-4 w-4" />
    </Button>
  );
}

interface ChartCardMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  hasContext?: boolean;
  ref?: () => void;
  children: React.ReactNode;
}

export function ChartCardMenu({ children, ref, hasContext = true }: ChartCardMenuProps) {
  const { isLocked, handleRename, handleRemove, handleResize, handleToggleLock } = useChartCard();

  const [newTitle, setNewTitle] = useState("");
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);

  return (
    <>
      {hasContext ? (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div>{children}</div>
          </ContextMenuTrigger>
          <ContextMenuContent ref={ref}>
            {/* Trigger the rename dialog via state rather than a nested Dialog */}
            <ContextMenuItem onClick={() => setIsRenameDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </ContextMenuItem>

            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Maximize2 className="mr-2 h-4 w-4" />
                Resize
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem onClick={() => handleResize(1)}>
                  <Minimize2 className="mr-2 h-4 w-4" />
                  Normal
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleResize(2)}>
                  <Maximize2 className="mr-2 h-4 w-4" />
                  Wide
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleResize(3)}>
                  <Maximize2 className="mr-2 h-4 w-4" />
                  Full Width
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuItem onClick={() => handleToggleLock()}>
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

            <ContextMenuItem className="text-red-600" onClick={() => handleRemove()}>
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>) : (<div>{children}</div>)}

      {/* Render the dialog outside of the context menu */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chart</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Enter new title" />
            <DialogClose asChild>
              <Button
                onClick={() => {
                  handleRename(newTitle);
                  setIsRenameDialogOpen(false);
                }}
              >
                Save
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// A simple wrapper that combines ChartCard with the Chart renderer
export function DataChart({ chart }: { chart: ChartItem }) {
  return (
    <ChartCard key={chart.id} size={chart.size} isLocked={chart.isLocked} id={chart.id}>
      <ChartCardMenu>
        <ChartCardHeader>
          <ChartCardTitle>{chart.title}</ChartCardTitle>
          <ChartCardHandle />
        </ChartCardHeader>
        <ChartCardContent>
          <Chart
            data={chart.data}
            config={{
              type: chart.type,
              title: chart.title,
              dataKeys: chart.dataKeys,
              colors: chart.colors,
              stacked: chart.stacked
            }}
            size={chart.size}
          />
        </ChartCardContent>
      </ChartCardMenu>
    </ChartCard>
  );
}
