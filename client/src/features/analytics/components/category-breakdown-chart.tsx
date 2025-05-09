import { useEffect, useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"

// Mock data for the chart
const data = [
  { name: "Housing", value: 1800, color: "#3b82f6" },
  { name: "Food", value: 850, color: "#10b981" },
  { name: "Transportation", value: 450, color: "#f59e0b" },
  { name: "Entertainment", value: 380, color: "#8b5cf6" },
  { name: "Shopping", value: 520, color: "#f43f5e" },
  { name: "Utilities", value: 320, color: "#64748b" },
  { name: "Healthcare", value: 280, color: "#06b6d4" },
  { name: "Other", value: 210, color: "#94a3b8" },
]

export default function CategoryBreakdownChart() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-[300px] flex items-center justify-center">Loading chart...</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`$${value}`, ""]}
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

