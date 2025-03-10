import { createFileRoute } from "@tanstack/react-router";

import { useDashboardStore, type chartTemplates } from "@/features/dashboard/stores/dashboard.store";
import { AddChartDialog } from "@/features/dashboard/components/add-chart";
import { DataChart } from "@/features/dashboard/components/chart-card";
import { DashboardGrid } from "@/features/dashboard/components/dashboard-grid";

export const Route = createFileRoute("/dashboard/home")({
  component: RouteComponent,
});

function RouteComponent() {
  const charts = useDashboardStore((state) => state.charts);
  const chartOrder = useDashboardStore((state) => state.chartOrder);
  const addChart = useDashboardStore((state) => state.addChart);

  const orderedCharts = chartOrder.map((id) => charts.find((c) => c.id === id)!);

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Good Morning Nameless</h2>
          <p className="text-gray-400">This is your financial report</p>
        </div>
      </div>
      <DashboardGrid>
        {orderedCharts.map((chart) => (
          <DataChart key={chart.id} chart={chart} />
        ))}
        <AddChartDialog onAddChart={(type) => addChart(type as keyof typeof chartTemplates)} />
      </DashboardGrid>
    </>
  );
}
