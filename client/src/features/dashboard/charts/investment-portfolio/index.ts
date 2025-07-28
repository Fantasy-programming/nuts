import { lazy } from 'react';
import type { DashboardChartModule } from '../types';

export const config: DashboardChartModule['config'] = {
  id: 'investment-portfolio',
  title: 'Investment Portfolio',
  description: 'Monitor your investment performance, allocation, and returns.',
  defaultSize: 2, // Medium size for portfolio overview
};

export const ChartComponent = lazy(() => import('./component'));

const moduleDefinition: DashboardChartModule = {
  config,
  ChartComponent,
};

export default moduleDefinition;