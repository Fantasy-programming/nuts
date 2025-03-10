import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { month: 'Jan', income: 2500 },
  { month: 'Feb', income: 2500 },
  { month: 'Mar', income: 2500 },
  { month: 'Apr', income: 2700 },
  { month: 'May', income: 2700 },
  { month: 'Jun', income: 2700 },
];

export function RentalIncomeChart() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold">$2,700</h3>
        <div className="flex items-center gap-2">
          <span className="text-green-500">+$200</span>
          <span className="text-green-500">(+8.0%)</span>
          <span className="text-muted-foreground">vs last quarter</span>
        </div>
      </div>
      <div className="h-[200px] w-full">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value}`, 'Rental Income']} />
            <Bar dataKey="income" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
