import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { cn } from "@/lib/utils";
import { DragHandleDots2Icon } from "@radix-ui/react-icons";

// Context
interface ChartCardContextValue {
  attributes?: Record<string, any>;
  listeners?: Record<string, any>;
  isDragging?: boolean;
  dragHandle?: "header" | "handle" | "disabled";
}

const ChartCardContext = React.createContext<ChartCardContextValue>({});

interface ChartCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Unique identifier for the chart */
  id: string;
  /** Whether the chart is draggable */
  draggable?: boolean;
  dragHandle?: "header" | "handle" | "disabled";
  /** Callback when drag starts */
  onDragStart?: () => void;
  /** Callback when drag ends */
  onDragEnd?: () => void;
}

const ChartCard = React.forwardRef<HTMLDivElement, ChartCardProps>(
  (
    {
      id,
      title,
      children,
      draggable = true,
      dragHandle = "handle",
      onDragStart,
      onDragEnd,
      className,
      ...props
    },
    ref,
  ) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id,
      disabled: !draggable || dragHandle === "disabled",
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const dragContext = React.useMemo(
      () => ({
        attributes,
        listeners,
        isDragging,
        dragHandle,
      }),
      [attributes, listeners, isDragging, dragHandle],
    );

    return (
      <ChartCardContext.Provider value={dragContext}>
        <Card
          ref={setNodeRef}
          className={cn(
            "relative group",
            isDragging && "opacity-50",
            className,
          )}
          style={style}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          {...props}
        >
          {children}
        </Card>
      </ChartCardContext.Provider>
    );
  },
);

ChartCard.displayName = "ChartCard";

// ChartCard Header component
interface ChartCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  showDragHandle?: boolean;
}

const ChartCardHeader = React.forwardRef<HTMLDivElement, ChartCardHeaderProps>(
  ({ showDragHandle = true, className, children, ...props }, ref) => {
    const { attributes, listeners, dragHandle } =
      React.useContext(ChartCardContext);

    const headerProps =
      dragHandle === "header" ? { ...attributes, ...listeners } : {};

    return (
      <CardHeader
        ref={ref}
        className={cn(
          "flex flex-row items-center justify-between space-y-0 pb-2",
          dragHandle === "header" && "cursor-move",
          className,
        )}
        {...headerProps}
        {...props}
      >
        {children}
      </CardHeader>
    );
  },
);

ChartCardHeader.displayName = "ChartCardHeader";

// ChartCard Title component
interface ChartCardTitleProps extends React.HTMLAttributes<HTMLDivElement> { }

const ChartCardTitle = React.forwardRef<HTMLDivElement, ChartCardTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("text-sm font-medium", className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
ChartCardTitle.displayName = "ChartCardTitle";

// ChartCard DragHandle component
interface ChartCardDragHandleProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
}

const ChartCardDragHandle = React.forwardRef<
  HTMLButtonElement,
  ChartCardDragHandleProps
>(({ className, icon, ...props }, ref) => {
  const { attributes, listeners, dragHandle } =
    React.useContext(ChartCardContext);

  if (dragHandle === "disabled") return null;

  const handleProps =
    dragHandle === "handle" ? { ...attributes, ...listeners } : {};

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn(
        "opacity-0 group-hover:opacity-100 transition-opacity",
        dragHandle === "handle" && "cursor-move",
        className,
      )}
      type="button"
      {...handleProps}
      {...props}
    >
      {icon || <DragHandleDots2Icon className="h-4 w-4" />}
    </Button>
  );
});
ChartCardDragHandle.displayName = "ChartCardDragHandle";

// ChartCard Content component
interface ChartCardContentProps extends React.HTMLAttributes<HTMLDivElement> { }

const ChartCardContent = React.forwardRef<
  HTMLDivElement,
  ChartCardContentProps
>(({ className, children, ...props }, ref) => {
  return (
    <CardContent ref={ref} className={cn(className)} {...props}>
      {children}
    </CardContent>
  );
});
ChartCardContent.displayName = "ChartCardContent";

export {
  ChartCard,
  ChartCardHeader,
  ChartCardTitle,
  ChartCardDragHandle,
  ChartCardContent,
};
