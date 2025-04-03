import { lazy } from 'react';
import type { DashboardChartModule } from '../types';

export const config: DashboardChartModule['config'] = {
  id: 'expense-income',
  title: 'Expense vs. Income',
  description: 'Compares total income and expenses over a period.',
  defaultSize: 2, // Example: Wide default size
  rendererConfig: {
    type: 'bar', // Example: Bar chart
    dataKeys: ['income', 'expense'], // Keys expected in the data
    colors: ['#22c55e', '#ef4444'], // Green for income, Red for expense
    stacked: false,
  },
};

export const ChartComponent = lazy(() => import('./component'));

const moduleDefinition: DashboardChartModule = {
  config,
  ChartComponent,
};

export default moduleDefinition;
