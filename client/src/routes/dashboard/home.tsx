import { createFileRoute } from "@tanstack/react-router";
import {
  Line,
  LineChart,
  PieChart,
  Pie,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Cell,
} from "recharts";
import { useDashboardStore } from "@/features/dashboard/stores/dashboard.store";
import { DashboardGrid } from "@/core/components/layouts/dashboard-grid";
import { ChartCard, ChartCardDragHandle, ChartCardHeader, ChartCardTitle } from "@/core/components/layouts/chart-card";
import { AddChartDialog } from "@/core/components/add-chart";
import {
  ChartTooltip,
  ChartTooltipContent,
  ChartContainer,
} from "@/core/components/ui/chart";
// import { TimeRangePicker } from "@/core/components/time-range-picker";

const lineData = [
  { name: "Jan", value: 400 },
  { name: "Feb", value: 300 },
  { name: "Mar", value: 600 },
  { name: "Apr", value: 800 },
  { name: "May", value: 700 },
];

const areaData = [
  { name: "Jan", income: 4000, expenses: 2400 },
  { name: "Feb", income: 3000, expenses: 1398 },
  { name: "Mar", income: 2000, expenses: 9800 },
  { name: "Apr", income: 2780, expenses: 3908 },
  { name: "May", income: 1890, expenses: 4800 },
];

const pieData = [
  { name: "Food", value: 400 },
  { name: "Transport", value: 300 },
  { name: "Shopping", value: 300 },
  { name: "Bills", value: 200 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export const Route = createFileRoute("/dashboard/home")({
  component: RouteComponent,
});

function RouteComponent() {
  const { charts, chartOrder, addChart } = useDashboardStore();

  const renderChart = (chart: (typeof charts)[0]) => {
    switch (chart.type) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        );
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      case "area":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={areaData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="income"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {pieData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        throw new Error("malformated chart data");
    }
  };

  const orderedCharts = chartOrder.map(
    (id) => charts.find((c) => c.id === id)!,
  );

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Good Morning Nameless</h2>
          <p className="text-gray-400">This is your financial report</p>
        </div>
        {/* <TimeRangePicker /> */}
      </div>
      <DashboardGrid>
        {orderedCharts.map((chart) => (
          <ChartCard key={chart.id} id={chart.id}>
            <ChartCardHeader showDragHandle={true}>
              <ChartCardTitle>{chart.title}</ChartCardTitle>
              <ChartCardDragHandle />
            </ChartCardHeader>
            <ChartContainer config={{}}>{renderChart(chart)}</ChartContainer>
          </ChartCard>
        ))}
        <AddChartDialog onAddChart={addChart} />
      </DashboardGrid>
    </>
  );
}
