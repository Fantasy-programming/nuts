import { lazy } from 'react';
import type { DashboardChartModule } from '../types';

export const config: DashboardChartModule['config'] = {
  id: 'budget-vs-actual',
  title: 'Budget vs Actual',
  description: 'Compare your planned budget with actual spending across categories.',
  defaultSize: 2, // Medium size for comparison view
};

export const ChartComponent = lazy(() => import('./component'));

const moduleDefinition: DashboardChartModule = {
  config,
  ChartComponent,
};

export default moduleDefinition;