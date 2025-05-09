import { useEffect, useState } from "react"
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// Mock data for the chart
const data = [
  { month: "Jan", portfolio: 5.2, benchmark: 4.8 },
  { month: "Feb", portfolio: 4.8, benchmark: 4.2 },
  { month: "Mar", portfolio: 6.5, benchmark: 5.5 },
  { month: "Apr", portfolio: 7.2, benchmark: 6.1 },
  { month: "May", portfolio: 6.8, benchmark: 5.9 },
  { month: "Jun", portfolio: 8.1, benchmark: 6.5 },
  { month: "Jul", portfolio: 7.5, benchmark: 6.2 },
  { month: "Aug", portfolio: 9.2, benchmark: 7.1 },
  { month: "Sep", portfolio: 8.7, benchmark: 6.8 },
  { month: "Oct", portfolio: 10.1, benchmark: 7.5 },
  { month: "Nov", portfolio: 9.5, benchmark: 7.2 },
  { month: "Dec", portfolio: 11.2, benchmark: 8.1 },
]

export default function InvestmentPerformanceChart() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-[300px] flex items-center justify-center">Loading chart...</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => `${value}%`} />
        <Tooltip
          formatter={(value) => [`${value}%`, ""]}
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="portfolio"
          name="Your Portfolio"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6, strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="benchmark"
          name="Market Benchmark"
          stroke="#94a3b8"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

