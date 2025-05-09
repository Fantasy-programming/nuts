import { useEffect, useState } from "react"
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// Mock data for the chart
const data = [
  { month: "Jan", income: 5200, expenses: 4100 },
  { month: "Feb", income: 5300, expenses: 4300 },
  { month: "Mar", income: 5800, expenses: 4500 },
  { month: "Apr", income: 5600, expenses: 4200 },
  { month: "May", income: 6100, expenses: 4800 },
  { month: "Jun", income: 6500, expenses: 5100 },
  { month: "Jul", income: 6400, expenses: 5000 },
  { month: "Aug", income: 6800, expenses: 5200 },
  { month: "Sep", income: 7200, expenses: 5500 },
  { month: "Oct", income: 7500, expenses: 5700 },
  { month: "Nov", income: 7800, expenses: 5900 },
  { month: "Dec", income: 8200, expenses: 6100 },
]

export default function IncomeExpenseChart() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-[350px] flex items-center justify-center">Loading chart...</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => `$${value}`} />
        <Tooltip
          formatter={(value) => [`$${value}`, ""]}
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="income"
          name="Income"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6, strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="expenses"
          name="Expenses"
          stroke="#f43f5e"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

