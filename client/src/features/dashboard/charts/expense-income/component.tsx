import { useSuspenseQuery } from '@tanstack/react-query';

import type { DashboardChartComponentProps } from '../types';
import { config } from './index';

import {
  ChartCard,
  ChartCardHeader,
  ChartCardTitle,
  ChartCardContent,
  ChartCardMenu,
  ChartCardHandle
} from '@/features/dashboard/components/chart-card';

import { Chart } from '@/features/dashboard/components/chart-card/chart-renderer';
import { ArrowUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts';

const fetchExpenseIncomeData = async () => {

  await new Promise(resolve => setTimeout(resolve, 800));

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


// The actual component rendered dynamically on the dashboard
function ExpenseIncomeChartComponent({ id, size, isLocked }: DashboardChartComponentProps) {
  const { data: chartData } = useExpenseIncomeData();

  return (
    <ChartCard id={id} size={size} isLocked={isLocked}>
      <ChartCardMenu>
        <div>
          <ChartCardHeader>
            <div className='flex-1'>
              <ChartCardTitle>{config.title}</ChartCardTitle>
              <p className="text-muted-foreground text-sm mt-1">Sales from 1-12 Apr, 2024</p>
            </div>
            <ChartCardHandle />
          </ChartCardHeader>
          <ChartCardContent className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold">$1,278.45</h2>
              <div className="flex items-center mt-1 text-sm">
                <ArrowUp className="h-4 w-4 mr-1 text-emerald-500" />
                <span className="text-emerald-500 font-medium">2.1%</span>
                <span className="text-muted-foreground ml-1">vs last week</span>
              </div>
            </div>
            {chartData ? (
              <Chart
                size={size}
              >
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={8}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip
                    // formatter={formatCurrency}
                    labelFormatter={(label) => `Day ${label}`}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #f3f4f6",
                      borderRadius: "0.5rem",
                      padding: "0.75rem",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    }}
                    itemStyle={{ padding: "2px 0" }}
                    cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                  />
                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    barSize={16}
                    animationDuration={300}
                  />
                  <Bar
                    dataKey="expense"
                    name="Expense"
                    fill="#a78bfa"
                    radius={[4, 4, 0, 0]}
                    barSize={16}
                    animationDuration={300}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "14px", paddingTop: "16px" }}
                  />
                </BarChart>
              </Chart>
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
