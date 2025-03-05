import { create } from "zustand";

export interface Chart {
  id: string;
  type: string;
  title: string;
  size: 1 | 2 | 3;
  isLocked: boolean;
}

interface DashboardState {
  charts: Chart[];
  chartOrder: string[];
  timeRange: {
    start: string;
    end: string;
  };
  addChart: (type: string) => void;
  removeChart: (id: string) => void;
  updateChartTitle: (id: string, title: string) => void;
  updateChartSize: (id: string, size: Chart["size"]) => void;
  toggleChartLock: (id: string) => void;
  reorderCharts: (oldIndex: number, newIndex: number) => void;
  setTimeRange: (range: { start: string; end: string }) => void;
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  charts: [
    { id: "1", type: "line", title: "Balance Overview", size: 1, isLocked: false },
    { id: "2", type: "area", title: "Income vs Expenses", size: 1, isLocked: false },
    { id: "3", type: "pie", title: "Expense Categories", size: 1, isLocked: false },
  ],
  chartOrder: ["1", "2", "3"],
  timeRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  },
  addChart: (type) =>
    set((state) => {
      const newChart = {
        id: (state.charts.length + 1).toString(),
        type,
        title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
        size: 1,
        isLocked: false,
      };
      return {
        charts: [...state.charts, newChart],
        chartOrder: [...state.chartOrder, newChart.id],
      };
    }),
  removeChart: (id) =>
    set((state) => ({
      charts: state.charts.filter((chart) => chart.id !== id),
      chartOrder: state.chartOrder.filter((chartId) => chartId !== id),
    })),
  updateChartTitle: (id, title) =>
    set((state) => ({
      charts: state.charts.map((chart) => (chart.id === id ? { ...chart, title } : chart)),
    })),
  updateChartSize: (id, size) =>
    set((state) => ({
      charts: state.charts.map((chart) => (chart.id === id ? { ...chart, size } : chart)),
    })),
  toggleChartLock: (id) =>
    set((state) => ({
      charts: state.charts.map((chart) => (chart.id === id ? { ...chart, isLocked: !chart.isLocked } : chart)),
    })),
  reorderCharts: (oldIndex, newIndex) =>
    set((state) => {
      const newOrder = [...state.chartOrder];
      const [removed] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, removed);
      return { chartOrder: newOrder };
    }),
  setTimeRange: (range) =>
    set(() => ({
      timeRange: range,
    })),
}));
