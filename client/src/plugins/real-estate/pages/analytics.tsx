import { useRealEstateStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Sample data for projections
const projectionData = [
  { year: '2023', value: 670000, equity: 210000, debt: 460000 },
  { year: '2024', value: 703500, equity: 263500, debt: 440000 },
  { year: '2025', value: 738675, equity: 318675, debt: 420000 },
  { year: '2026', value: 775609, equity: 375609, debt: 400000 },
  { year: '2027', value: 814389, equity: 434389, debt: 380000 },
  { year: '2028', value: 855109, equity: 495109, debt: 360000 },
  { year: '2029', value: 897864, equity: 557864, debt: 340000 },
  { year: '2030', value: 942757, equity: 622757, debt: 320000 },
];

const cashFlowData = [
  { year: '2023', income: 21600, expenses: 24800, cashFlow: -3200 },
  { year: '2024', income: 22680, expenses: 24800, cashFlow: -2120 },
  { year: '2025', income: 23814, expenses: 24800, cashFlow: -986 },
  { year: '2026', income: 25005, expenses: 24800, cashFlow: 205 },
  { year: '2027', income: 26255, expenses: 24800, cashFlow: 1455 },
  { year: '2028', income: 27568, expenses: 24800, cashFlow: 2768 },
  { year: '2029', income: 28946, expenses: 24800, cashFlow: 4146 },
  { year: '2030', income: 30393, expenses: 24800, cashFlow: 5593 },
];

const roiData = [
  { year: '2023', roi: 2.1 },
  { year: '2024', roi: 3.2 },
  { year: '2025', roi: 4.3 },
  { year: '2026', roi: 5.4 },
  { year: '2027', roi: 6.5 },
  { year: '2028', roi: 7.6 },
  { year: '2029', roi: 8.7 },
  { year: '2030', roi: 9.8 },
];

export function Analytics() {
  const { totalValue, totalEquity, totalDebt } = useRealEstateStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Real Estate Analytics</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Value Projection</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                name="Property Value"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Equity Growth Projection</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  name="Equity"
                />
                <Area
                  type="monotone"
                  dataKey="debt"
                  stackId="1"
                  stroke="#EF4444"
                  fill="#EF4444"
                  name="Debt"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Projection</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                <Legend />
                <Bar dataKey="income" name="Rental Income" fill="#10B981" />
                <Bar dataKey="expenses" name="Expenses" fill="#EF4444" />
                <Line
                  type="monotone"
                  dataKey="cashFlow"
                  stroke="#8884d8"
                  name="Net Cash Flow"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Return on Investment (ROI)</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={roiData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, 'ROI']} />
              <Legend />
              <Line
                type="monotone"
                dataKey="roi"
                stroke="#8884d8"
                name="ROI %"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export default Analytics;
