import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DragHandleDots2Icon } from "@radix-ui/react-icons";

interface ChartCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Unique identifier for the chart */
  id: string;
  /** Title of the chart */
  title: string;
  /** Whether to show the drag handle */
  showDragHandle?: boolean;
  /** Additional classes for the container */
  containerClassName?: string;
  /** Additional classes for the header */
  headerClassName?: string;
  /** Additional classes for the content */
  contentClassName?: string;
  /** Custom drag handle component */
  dragHandleComponent?: React.ReactNode;
  /** Whether the chart is draggable */
  draggable?: boolean;
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
      showDragHandle = true,
      containerClassName,
      headerClassName,
      contentClassName,
      dragHandleComponent,
      draggable = true,
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
      disabled: !draggable,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const handleDragStart = () => {
      onDragStart?.();
    };

    const handleDragEnd = () => {
      onDragEnd?.();
    };

    return (
      <Card
        ref={setNodeRef}
        className={cn(
          "relative group",
          containerClassName,
          isDragging && "opacity-50",
          className,
        )}
        style={style}
        {...(draggable ? { ...attributes, ...listeners } : {})}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        {...props}
      >
        <CardHeader
          className={cn(
            "flex flex-row items-center justify-between space-y-0 pb-2",
            headerClassName,
          )}
        >
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {showDragHandle && draggable && (
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              type="button"
            >
              {dragHandleComponent || (
                <DragHandleDots2Icon className="h-4 w-4" />
              )}
            </Button>
          )}
        </CardHeader>
        <CardContent ref={ref} className={cn(contentClassName)}>
          {children}
        </CardContent>
      </Card>
    );
  },
);

ChartCard.displayName = "ChartCard";

export { ChartCard };
