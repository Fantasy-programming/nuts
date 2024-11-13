import { create } from "zustand";

export interface Chart {
  id: string;
  type: string;
  title: string;
}

interface DashboardState {
  charts: Chart[];
  chartOrder: string[];
  addChart: (type: string) => void;
  removeChart: (id: string) => void;
  updateChartTitle: (id: string, title: string) => void;
  reorderCharts: (oldIndex: number, newIndex: number) => void;
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  charts: [
    { id: "1", type: "line", title: "Balance Overview" },
    { id: "2", type: "area", title: "Income vs Expenses" },
    { id: "3", type: "pie", title: "Expense Categories" },
  ],
  chartOrder: ["1", "2", "3"],
  addChart: (type) =>
    set((state) => {
      const newChart = {
        id: (state.charts.length + 1).toString(),
        type,
        title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
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
      charts: state.charts.map((chart) =>
        chart.id === id ? { ...chart, title } : chart,
      ),
    })),
  reorderCharts: (oldIndex, newIndex) =>
    set((state) => {
      const newOrder = [...state.chartOrder];
      const [removed] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, removed);
      return { chartOrder: newOrder };
    }),
}));
