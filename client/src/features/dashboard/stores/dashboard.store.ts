import { create } from "zustand";
import { ChartSize } from '@/features/dashboard/components/chart-card';
import { persist } from "zustand/middleware";
import { getAvailableChartConfigs } from "../charts/loader";
import { arrayMove } from "@dnd-kit/sortable";


interface DashboardChartLayout {
  id: string; // Corresponds to the ID in DashboardChartModuleConfig
  size: ChartSize;
  isLocked: boolean;
}


// export type ComponentSize = 1 | 2 | 3;
// allowedSizes: ComponentSize[];

// interface ChartCardInterface {
//   id: string,
//   name?: string,
//   defaultName: string,
//   metadata: {
//     allowedSizes: number[],
//     defaultSize: 1 | 2 | 3,
//     minHeight?: number,
//   }
// }

interface DashboardState {
  chartLayout: DashboardChartLayout[];
  chartOrder: string[]; // Array of chart IDs in display order
  addChart: (chartId: string) => Promise<void>; // Make async to fetch config
  removeChart: (chartId: string) => void;
  reorderCharts: (oldIndex: number, newIndex: number) => void;
  updateChartSize: (chartId: string, size: ChartSize) => void;
  toggleChartLock: (chartId: string) => void;
}


// interface DashboardState2 {
//   components: DashboardComponent[];
//   componentOrder: string[];
//   timeRange: {
//     start: string;
//     end: string;
//   };
//   addComponent: (type: string) => void;
//   removeComponent: (id: string) => void;
//   updateComponentTitle: (id: string, title: string) => void;
//   updateComponentSize: (id: string, size: ComponentSize) => void;
//   toggleComponentLock: (id: string) => void;
//   reorderComponents: (oldIndex: number, newIndex: number) => void;
//   setTimeRange: (range: { start: string; end: string }) => void;
//   loadComponent: (type: string) => Promise<any>;
//   getComponentMetadata: (type: string) => ComponentMetadata | undefined;
// }

// load from the registry


// interface DashboardState {
//   charts: ChartItem[];
//   chartOrder: string[];
//
//   timeRange: {
//     start: string;
//     end: string;
//   };
//   addChart: (type: keyof typeof chartTemplates, title?: string) => void;
//   removeChart: (id: string) => void;
//   updateChartTitle: (id: string, title: string) => void;
//   updateChartSize: (id: string, size: ChartSize) => void;
//   toggleChartLock: (id: string) => void;
//   reorderCharts: (oldIndex: number, newIndex: number) => void;
//   setTimeRange: (range: { start: string; end: string }) => void;
// }


export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      chartLayout: [], // Start with an empty layout
      chartOrder: [],

      addChart: async (chartId) => {
        const currentLayout = get().chartLayout;
        // Prevent adding duplicates
        if (currentLayout.some(chart => chart.id === chartId)) {
          console.warn(`Chart "${chartId}" is already on the dashboard.`);
          return;
        }

        // Fetch available configs to find the default size
        // This could be optimized by loading configs once upfront if preferred
        try {
          const availableConfigs = await getAvailableChartConfigs();
          const chartConfig = availableConfigs.find(c => c.id === chartId);

          if (!chartConfig) {
            console.error(`Configuration for chart "${chartId}" not found.`);
            return;
          }

          const newChart: DashboardChartLayout = {
            id: chartId,
            size: chartConfig.defaultSize, // Use default size from config
            isLocked: false,
          };

          set((state) => ({
            chartLayout: [...state.chartLayout, newChart],
            chartOrder: [...state.chartOrder, chartId],
          }));
        } catch (error) {
          console.error(`Failed to add chart "${chartId}":`, error);
        }
      },

      removeChart: (chartId) => {
        set((state) => ({
          chartLayout: state.chartLayout.filter((chart) => chart.id !== chartId),
          chartOrder: state.chartOrder.filter((id) => id !== chartId),
        }));
      },

      reorderCharts: (oldIndex, newIndex) => {
        set((state) => ({
          chartOrder: arrayMove(state.chartOrder, oldIndex, newIndex),
        }));
      },

      updateChartSize: (chartId, size) => {
        set((state) => ({
          chartLayout: state.chartLayout.map((chart) =>
            chart.id === chartId ? { ...chart, size: size } : chart
          ),
        }));
      },

      toggleChartLock: (chartId) => {
        set((state) => ({
          chartLayout: state.chartLayout.map((chart) =>
            chart.id === chartId ? { ...chart, isLocked: !chart.isLocked } : chart
          ),
        }));
      },
    }),
    {
      name: 'dashboard-layout-storage', // Changed storage name
      // Optionally migrate from the old structure if needed
    }
  )
);


// export const useDashboardStore = create<DashboardState>()((set) => ({
//   charts: initialCharts,
//   chartOrder: initialCharts.map((chart) => chart.id),
//   timeRange: {
//     start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
//     end: new Date().toISOString(),
//   },
//   addChart: (type, title) => {
//
//     const template = chartTemplates[type];
//     const newChart: ChartItem = {
//       id: crypto.randomUUID(),
//       title: title || template.title,
//       type: template.type,
//       size: 1,
//       isLocked: false,
//       dataKeys: template.dataKeys,
//       colors: template.colors,
//       stacked: template.stacked,
//       data: template.data,
//     };
//
//
//     set((state) => ({
//       charts: [...state.charts, newChart],
//       chartOrder: [...state.chartOrder, newChart.id],
//     }));
//   },
//   removeChart: (id) =>
//     set((state) => ({
//       charts: state.charts.filter((chart) => chart.id !== id),
//       chartOrder: state.chartOrder.filter((chartId) => chartId !== id),
//     })),
//   updateChartTitle: (id, title) =>
//     set((state) => ({
//       charts: state.charts.map((chart) => (chart.id === id ? { ...chart, title } : chart)),
//     })),
//   updateChartSize: (id, size) =>
//     set((state) => ({
//       charts: state.charts.map((chart) => (chart.id === id ? { ...chart, size } : chart)),
//     })),
//   toggleChartLock: (id) =>
//     set((state) => ({
//       charts: state.charts.map((chart) => (chart.id === id ? { ...chart, isLocked: !chart.isLocked } : chart)),
//     })),
//   reorderCharts: (oldIndex, newIndex) =>
//     set((state) => {
//       const newOrder = [...state.chartOrder];
//       const [removed] = newOrder.splice(oldIndex, 1);
//       newOrder.splice(newIndex, 0, removed);
//       return { chartOrder: newOrder };
//     }),
//   setTimeRange: (range) =>
//     set(() => ({
//       timeRange: range,
//     })),
// }));
