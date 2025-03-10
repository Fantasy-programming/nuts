import { create } from "zustand";
import { ChartItem, ChartSize } from '@/core/components/chart-card';


// Sample data for different chart types
const lineData = [
  { name: "Jan", value: 400 },
  { name: "Feb", value: 300 },
  { name: "Mar", value: 600 },
  { name: "Apr", value: 800 },
  { name: "May", value: 700 },
];

const areaData = [
  { name: "Jan", income: 4000, expenses: 2400 },
  { name: "Feb", income: 3000, expenses: 1398 },
  { name: "Mar", income: 2000, expenses: 9800 },
  { name: "Apr", income: 2780, expenses: 3908 },
  { name: "May", income: 1890, expenses: 4800 },
];

const pieData = [
  { name: "Food", value: 400 },
  { name: "Transport", value: 300 },
  { name: "Shopping", value: 300 },
  { name: "Bills", value: 200 },
];

const barData = [
  { name: "Jan", revenue: 4000, profit: 2400 },
  { name: "Feb", revenue: 3000, profit: 1398 },
  { name: "Mar", revenue: 2000, profit: 800 },
  { name: "Apr", revenue: 2780, profit: 1908 },
  { name: "May", revenue: 1890, profit: 800 },
];

const CHART_COLORS = {
  blue: "#0088FE",
  green: "#00C49F",
  yellow: "#FFBB28",
  orange: "#FF8042",
  purple: "#8884d8",
  lightGreen: "#82ca9d",
};

// Define initial charts
const initialCharts: ChartItem[] = [
  {
    id: "line-chart",
    title: "Monthly Performance",
    type: "line",
    size: 1,
    stacked: false,
    isLocked: false,
    dataKeys: ["value"],
    colors: [CHART_COLORS.purple],
    data: lineData,
  },
  {
    id: "area-chart",
    title: "Income vs Expenses",
    type: "area",
    size: 2,
    isLocked: false,
    stacked: false,
    dataKeys: ["income", "expenses"],
    colors: [CHART_COLORS.purple, CHART_COLORS.lightGreen],
    data: areaData,
  },
  {
    id: "pie-chart",
    title: "Expense Breakdown",
    type: "pie",
    size: 1,
    isLocked: false,
    stacked: false,
    dataKeys: ["value"],
    colors: [CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.yellow, CHART_COLORS.orange],
    data: pieData,
  },
  {
    id: "bar-chart",
    title: "Revenue & Profit",
    type: "bar",
    size: 3,
    isLocked: false,
    stacked: false,
    dataKeys: ["revenue", "profit"],
    colors: [CHART_COLORS.blue, CHART_COLORS.green],
    data: barData,
  },
];


// Available chart templates for adding new charts
export const chartTemplates = {
  line: {
    type: "line" as const,
    title: "Line Chart",
    dataKeys: ["value"],
    colors: [CHART_COLORS.purple],
    data: lineData,
    stacked: false,
  },
  bar: {
    type: "bar" as const,
    title: "Bar Chart",
    dataKeys: ["revenue", "profit"],
    colors: [CHART_COLORS.blue, CHART_COLORS.green],
    data: barData,
    stacked: false,
  },
  area: {
    type: "area" as const,
    title: "Area Chart",
    dataKeys: ["income", "expenses"],
    colors: [CHART_COLORS.purple, CHART_COLORS.lightGreen],
    stacked: true,
    data: areaData,
  },
  pie: {
    type: "pie" as const,
    title: "Pie Chart",
    dataKeys: ["value"],
    colors: [CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.yellow, CHART_COLORS.orange],
    data: pieData,
    stacked: false,
  },
};


interface DashboardState {
  charts: ChartItem[];
  chartOrder: string[];

  timeRange: {
    start: string;
    end: string;
  };
  addChart: (type: keyof typeof chartTemplates, title?: string) => void;
  removeChart: (id: string) => void;
  updateChartTitle: (id: string, title: string) => void;
  updateChartSize: (id: string, size: ChartSize) => void;
  toggleChartLock: (id: string) => void;
  reorderCharts: (oldIndex: number, newIndex: number) => void;
  setTimeRange: (range: { start: string; end: string }) => void;
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  charts: initialCharts,
  chartOrder: initialCharts.map((chart) => chart.id),
  timeRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  },
  addChart: (type, title) => {

    const template = chartTemplates[type];
    const newChart: ChartItem = {
      id: crypto.randomUUID(),
      title: title || template.title,
      type: template.type,
      size: 1,
      isLocked: false,
      dataKeys: template.dataKeys,
      colors: template.colors,
      stacked: template.stacked,
      data: template.data,
    };


    set((state) => ({
      charts: [...state.charts, newChart],
      chartOrder: [...state.chartOrder, newChart.id],
    }));
  },
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
