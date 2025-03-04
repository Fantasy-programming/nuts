import React, { useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useDashboardStore } from "@/features/dashboard/stores/dashboard.store";

interface DashboardGridProps {
  children: React.ReactNode;
}

export const DashboardGrid = React.memo(({ children }: DashboardGridProps) => {
  const { chartOrder, reorderCharts } = useDashboardStore();

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = chartOrder.indexOf(active.id.toString());
      const newIndex = chartOrder.indexOf(over.id.toString());
      reorderCharts(oldIndex, newIndex);
    }
  }, [chartOrder, reorderCharts]);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={chartOrder} strategy={rectSortingStrategy}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {children}
        </div>
      </SortableContext>
    </DndContext>
  );
});
