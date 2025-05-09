import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// Mock data for the chart
const data = [
  { month: "Jan", assets: 120000, liabilities: 85000 },
  { month: "Feb", assets: 122500, liabilities: 84200 },
  { month: "Mar", assets: 125000, liabilities: 83500 },
  { month: "Apr", assets: 128000, liabilities: 82800 },
  { month: "May", assets: 132000, liabilities: 82000 },
  { month: "Jun", assets: 135000, liabilities: 81200 },
  { month: "Jul", assets: 138000, liabilities: 80500 },
  { month: "Aug", assets: 142000, liabilities: 79800 },
  { month: "Sep", assets: 145000, liabilities: 79000 },
  { month: "Oct", assets: 148000, liabilities: 78200 },
  { month: "Nov", assets: 152000, liabilities: 77500 },
  { month: "Dec", assets: 156000, liabilities: 76800 },
]

// Add net worth calculation
const dataWithNetWorth = data.map((item) => ({
  ...item,
  netWorth: item.assets - item.liabilities,
}))

export default function NetWorthChart() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-[300px] flex items-center justify-center">Loading chart...</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={dataWithNetWorth} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
        <Tooltip
          formatter={(value) => [`$${value.toLocaleString()}`, ""]}
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Area type="monotone" dataKey="assets" name="Assets" stackId="1" stroke="#10b981" fill="#10b98120" />
        <Area type="monotone" dataKey="liabilities" name="Liabilities" stackId="2" stroke="#f43f5e" fill="#f43f5e20" />
        <Area type="monotone" dataKey="netWorth" name="Net Worth" stroke="#3b82f6" fill="#3b82f620" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

