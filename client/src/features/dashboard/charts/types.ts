// features/dashboard/charts/types.ts

import type { ComponentType } from 'react';
import type { ChartSize } from '@/features/dashboard/components/chart-card'; // Assuming ChartSize is defined here

// Static configuration exported by each chart module's index.ts
export interface DashboardChartModuleConfig {
  id: string; // Unique ID (e.g., 'expense-income')
  title: string; // Default display title
  description?: string; // Optional description for selection dialog
  defaultSize: ChartSize;
  // Include essential rendering config defaults if needed
}

// Interface for the dynamically loaded module
export interface DashboardChartModule {
  config: DashboardChartModuleConfig;
  ChartComponent: React.LazyExoticComponent<ComponentType<DashboardChartComponentProps>>; // The lazy-loadable component
}

// Props that will be passed from the dashboard layout store to the ChartComponent
export interface DashboardChartComponentProps {
  id: string; // Instance ID (same as module ID in this simple case)
  size: ChartSize;
  isLocked: boolean;
}
