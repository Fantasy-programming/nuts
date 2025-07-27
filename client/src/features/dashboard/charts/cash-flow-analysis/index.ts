import { lazy } from 'react';
import type { DashboardChartModule } from '../types';

export const config: DashboardChartModule['config'] = {
  id: 'cash-flow-analysis',
  title: 'Cash Flow Analysis',
  description: 'Track income vs expenses with future projections and net cash flow.',
  defaultSize: 3, // Large size for comprehensive analysis
};

export const ChartComponent = lazy(() => import('./component'));

const moduleDefinition: DashboardChartModule = {
  config,
  ChartComponent,
};

export default moduleDefinition;