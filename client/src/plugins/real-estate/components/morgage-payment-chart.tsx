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
  { month: 'Jan', principal: 800, interest: 700 },
  { month: 'Feb', principal: 810, interest: 690 },
  { month: 'Mar', principal: 820, interest: 680 },
  { month: 'Apr', principal: 830, interest: 670 },
  { month: 'May', principal: 840, interest: 660 },
  { month: 'Jun', principal: 850, interest: 650 },
];

export function MortgagePaymentChart() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold">$1,500</h3>
        <div className="flex items-center gap-2">
          <span className="text-green-500">Principal: $850</span>
          <span className="text-red-500">Interest: $650</span>
        </div>
      </div>
      <div className="h-[200px] w-full">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value}`, '']} />
            <Line
              type="monotone"
              dataKey="principal"
              stroke="#10B981"
              name="Principal"
            />
            <Line
              type="monotone"
              dataKey="interest"
              stroke="#EF4444"
              name="Interest"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
