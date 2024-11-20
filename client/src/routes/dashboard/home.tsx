import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, BarChart3, Users, Wallet } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useDashboardStore } from "@/store/dashboard.store";
import { DashboardGrid } from "@/components/layouts/dashboard-grid";
import { ChartContainer } from "@/components/layouts/chart-card";
import { Tooltip } from "@/components/ui/tooltip";
import { AddChartDialog } from "@/components/add-chart";

const accountData = [
  {
    name: "Cash",
    balance: "0.00",
    color: "bg-orange-500",
    icon: Wallet,
  },
  {
    name: "Mikronet",
    balance: "0.00",
    color: "bg-green-600",
    icon: CreditCard,
  },
  {
    name: "Exness",
    balance: "0.00",
    color: "bg-gray-800",
    icon: BarChart3,
  },
  {
    name: "Work",
    balance: "0.00",
    color: "bg-teal-600",
    icon: Users,
  },
  {
    name: "Savings",
    balance: "0.00",
    color: "bg-blue-500",
    icon: Wallet,
  },
];

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
              <Tooltip />
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
              <Tooltip />
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
              <Tooltip />
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
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  const orderedCharts = chartOrder.map(
    (id) => charts.find((c) => c.id === id)!,
  );

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">
                  Building Your Application
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Data Fetching</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <main className="flex flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {accountData.map((account) => (
              <Card key={account.name}>
                <CardHeader
                  className={`flex flex-row items-center justify-between space-y-0 ${account.color} text-white rounded-t-lg`}
                >
                  <CardTitle className="text-sm font-medium">
                    {account.name}
                  </CardTitle>
                  <account.icon className="h-4 w-4" />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">
                    GHS {account.balance}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <DashboardGrid>
            {orderedCharts.map((chart) => (
              <ChartContainer key={chart.id} id={chart.id} title={chart.title}>
                {renderChart(chart)}
              </ChartContainer>
            ))}
            <AddChartDialog onAddChart={addChart} />
          </DashboardGrid>
        </div>
      </main>
    </>
  );
}
