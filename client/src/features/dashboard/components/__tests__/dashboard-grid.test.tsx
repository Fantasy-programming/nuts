import { describe, it, expect, vi } from 'vitest';
import { DashboardGrid } from '../dashboard-grid';

// Mock the DndContext and related components
vi.mock('@dnd-kit/core', () => ({
  DndContext: vi.fn(),
  MouseSensor: vi.fn(),
  TouchSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: vi.fn(),
  rectSortingStrategy: {},
}));

// Mock the dashboard store
vi.mock('@/features/dashboard/stores/dashboard.store', () => ({
  useDashboardStore: vi.fn((selector: any) => {
    const mockState = {
      chartOrder: ['chart1', 'chart2'],
      reorderCharts: vi.fn(),
    };
    return selector(mockState);
  }),
}));

describe('DashboardGrid Masonry Layout', () => {
  it('should be imported successfully', () => {
    expect(DashboardGrid).toBeDefined();
  });

  it('should be a valid React component', () => {
    // React.memo returns an object with $$typeof property for React components
    expect(DashboardGrid).toHaveProperty('$$typeof');
  });
});