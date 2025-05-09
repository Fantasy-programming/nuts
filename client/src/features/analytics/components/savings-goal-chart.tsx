import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts"

// Mock data for the chart
const data = [
  { name: "Emergency Fund", target: 15000, current: 8500, color: "#10b981" },
  { name: "Vacation", target: 5000, current: 3200, color: "#3b82f6" },
  { name: "New Car", target: 25000, current: 6800, color: "#f59e0b" },
  { name: "Home Down Payment", target: 60000, current: 12800, color: "#8b5cf6" },
]

export default function SavingsGoalChart() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-[300px] flex items-center justify-center">Loading chart...</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis type="number" tickFormatter={(value) => `$${value / 1000}k`} />
        <YAxis type="category" dataKey="name" width={120} />
        <Tooltip
          formatter={(value) => [`$${value}`, ""]}
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Bar dataKey="target" name="Target" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
        <Bar dataKey="current" name="Current" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

