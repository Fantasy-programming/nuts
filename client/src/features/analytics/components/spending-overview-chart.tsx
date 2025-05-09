import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// Mock data for the chart
const data = [
  { month: "Jan", groceries: 420, dining: 380, entertainment: 220, shopping: 350, utilities: 280 },
  { month: "Feb", groceries: 460, dining: 420, entertainment: 280, shopping: 290, utilities: 290 },
  { month: "Mar", groceries: 480, dining: 450, entertainment: 320, shopping: 380, utilities: 300 },
  { month: "Apr", groceries: 520, dining: 480, entertainment: 300, shopping: 420, utilities: 280 },
  { month: "May", groceries: 490, dining: 520, entertainment: 350, shopping: 390, utilities: 290 },
  { month: "Jun", groceries: 550, dining: 540, entertainment: 380, shopping: 430, utilities: 310 },
]

export default function SpendingOverviewChart() {
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
        <Bar dataKey="groceries" name="Groceries" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="dining" name="Dining" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="entertainment" name="Entertainment" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="shopping" name="Shopping" fill="#f43f5e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="utilities" name="Utilities" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

