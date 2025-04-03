import { useMemo } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';

import type { DashboardChartComponentProps } from '../types';
import { config } from './index';

// Assuming you have chart components structured like this
import {
  ChartCard,
  ChartCardHeader,
  ChartCardTitle,
  ChartCardContent,
  ChartCardMenu,
  ChartCardHandle
} from '@/features/dashboard/components/chart-card';
import { Chart } from '@/features/dashboard/components/chart-card/chart-renderer';

// ---- Data Fetching Logic (Example) ----
// Replace with your actual data fetching using React Query
const fetchExpenseIncomeData = async () => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 800));
  // Return data in the format expected by ChartDataPoint[]
  // And keys matching config.rendererConfig.dataKeys
  return [
    { month: 'Jan', income: 5000, expense: 3500 },
    { month: 'Feb', income: 5500, expense: 4000 },
    { month: 'Mar', income: 6000, expense: 3800 },
    { month: 'Apr', income: 5800, expense: 4200 },
    { month: 'May', income: 6500, expense: 4500 },
    { month: 'Jun', income: 7000, expense: 4800 },
  ];
};

const useExpenseIncomeData = () => {
  return useSuspenseQuery({
    queryKey: ['dashboardChart', 'expenseIncomeData'], // Unique query key
    queryFn: fetchExpenseIncomeData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// ---- End Data Fetching Logic ----


// The actual component rendered dynamically on the dashboard
function ExpenseIncomeChartComponent({ id, size, isLocked }: DashboardChartComponentProps) {
  const { data: chartData } = useExpenseIncomeData(); // Fetch data

  // Memoize the final config passed to the Chart renderer
  // Combines static config with potentially dynamic elements if needed
  const rendererConfig = useMemo(() => ({
    type: config.rendererConfig.type,
    title: config.title, // Pass title for context
    dataKeys: config.rendererConfig.dataKeys,
    colors: config.rendererConfig.colors,
    stacked: config.rendererConfig.stacked,
  }), []); // Depends only on static config here

  return (
    <ChartCard id={id} size={size} isLocked={isLocked}>
      <ChartCardMenu>
        <div>
          <ChartCardHeader>
            <ChartCardTitle>{config.title}</ChartCardTitle>
            <ChartCardHandle />
          </ChartCardHeader>
          <ChartCardContent>
            {chartData ? (
              <Chart
                data={chartData}
                config={rendererConfig}
                size={size}
              />
            ) : (
              <div>Loading chart data...</div>
            )}
          </ChartCardContent>
        </div>
      </ChartCardMenu>
    </ChartCard>
  );
}

export default ExpenseIncomeChartComponent; // Default export for React.lazy
