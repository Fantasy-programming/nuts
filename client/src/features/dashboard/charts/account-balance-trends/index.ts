import { lazy } from 'react';
import type { DashboardChartModule } from '../types';

export const config: DashboardChartModule['config'] = {
  id: 'account-balance-trends',
  title: 'Account Balance Trends',
  description: 'Track balance changes across all your accounts over time.',
  defaultSize: 3, // Large size to show timeline effectively
};

export const ChartComponent = lazy(() => import('./component'));

const moduleDefinition: DashboardChartModule = {
  config,
  ChartComponent,
};

export default moduleDefinition;