import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// Mock data for the chart
const data = [
  { category: "Housing", budget: 1800, actual: 1750 },
  { category: "Food", budget: 800, actual: 920 },
  { category: "Transportation", budget: 400, actual: 380 },
  { category: "Entertainment", budget: 300, actual: 450 },
  { category: "Shopping", budget: 400, actual: 520 },
  { category: "Utilities", budget: 350, actual: 320 },
  { category: "Healthcare", budget: 300, actual: 280 },
  { category: "Other", budget: 250, actual: 210 },
]

export default function BudgetComparisonChart() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-[350px] flex items-center justify-center">Loading chart...</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis type="number" tickFormatter={(value) => `$${value}`} />
        <YAxis type="category" dataKey="category" width={100} />
        <Tooltip
          formatter={(value) => [`$${value}`, ""]}
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Legend />
        <Bar dataKey="budget" name="Budget" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        <Bar dataKey="actual" name="Actual" fill="#f59e0b" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

