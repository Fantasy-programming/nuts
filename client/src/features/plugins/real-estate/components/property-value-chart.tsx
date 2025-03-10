import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { month: 'Jan', value: 350000 },
  { month: 'Feb', value: 352000 },
  { month: 'Mar', value: 355000 },
  { month: 'Apr', value: 358000 },
  { month: 'May', value: 362000 },
  { month: 'Jun', value: 365000 },
];

export function PropertyValueChart() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold">$365,000</h3>
        <div className="flex items-center gap-2">
          <span className="text-green-500">+$15,000</span>
          <span className="text-green-500">(+4.3%)</span>
          <span className="text-muted-foreground">since purchase</span>
        </div>
      </div>
      <div className="h-[200px] w-full">
        <ResponsiveContainer>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value}`, 'Property Value']} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              fill="#8884d8"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
