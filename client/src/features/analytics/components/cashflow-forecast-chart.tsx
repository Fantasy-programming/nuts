import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// Mock data for the chart
const data = [
  { month: "Jan", income: 8500, expenses: 6200, savings: 2300, projection: 2300 },
  { month: "Feb", income: 8500, expenses: 6300, savings: 2200, projection: 2250 },
  { month: "Mar", income: 8500, expenses: 6100, savings: 2400, projection: 2350 },
  { month: "Apr", income: 8500, expenses: 6400, savings: 2100, projection: 2200 },
  { month: "May", income: 8500, expenses: 6200, savings: 2300, projection: 2250 },
  { month: "Jun", income: 8500, expenses: 6300, savings: 2200, projection: 2300 },
  // Future projections
  { month: "Jul", income: 8700, expenses: 6400, savings: 2300, projection: 2300 },
  { month: "Aug", income: 8700, expenses: 6500, savings: 2200, projection: 2250 },
  { month: "Sep", income: 8700, expenses: 6300, savings: 2400, projection: 2350 },
  { month: "Oct", income: 8700, expenses: 6600, savings: 2100, projection: 2200 },
  { month: "Nov", income: 8900, expenses: 6500, savings: 2400, projection: 2350 },
  { month: "Dec", income: 8900, expenses: 6700, savings: 2200, projection: 2250 },
]

export default function CashflowForecastChart() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-[350px] flex items-center justify-center">Loading chart...</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
        <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="savings" name="Savings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

