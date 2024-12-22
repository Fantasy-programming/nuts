import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { month: 'Jan', spending: 1200, income: 2400 },
  { month: 'Feb', spending: 1800, income: 2300 },
  { month: 'Mar', spending: 1600, income: 2800 },
  { month: 'Apr', spending: 1400, income: 2600 },
  { month: 'May', spending: 2000, income: 3000 },
];


export const Route = createFileRoute("/dashboard/analytics")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="spending" stroke="#8884d8" name="Spending" />
              <Line type="monotone" dataKey="income" stroke="#82ca9d" name="Income" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
