import { lazy } from 'react';
import type { DashboardChartModule } from '../types';

export const config: DashboardChartModule['config'] = {
  id: 'monthly-spending-patterns',
  title: 'Monthly Spending Patterns',
  description: 'Analyze your spending patterns by month and category.',
  defaultSize: 2, // Medium size for detailed breakdown
};

export const ChartComponent = lazy(() => import('./component'));

const moduleDefinition: DashboardChartModule = {
  config,
  ChartComponent,
};

export default moduleDefinition;