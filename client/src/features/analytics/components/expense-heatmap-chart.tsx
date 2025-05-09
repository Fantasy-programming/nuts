import { useEffect, useState } from "react"
import { ResponsiveContainer, Tooltip, XAxis, YAxis, ScatterChart, Scatter, Cell } from "recharts"

// Mock data for the heatmap
const generateData = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const categories = ["Food", "Shopping", "Transport", "Entertainment", "Utilities"]

  const data = []

  for (let i = 0; i < days.length; i++) {
    for (let j = 0; j < categories.length; j++) {
      const value = Math.floor(Math.random() * 200) + 10
      data.push({
        x: i,
        y: j,
        z: value,
        day: days[i],
        category: categories[j],
      })
    }
  }

  return data
}

const data = generateData()

// Function to get color based on value
const getColor = (value: number) => {
  if (value < 50) return "#e2e8f0"
  if (value < 100) return "#93c5fd"
  if (value < 150) return "#3b82f6"
  return "#1d4ed8"
}

export default function ExpenseHeatmapChart() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-[300px] flex items-center justify-center">Loading chart...</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 80 }}>
        <XAxis type="category" dataKey="day" name="Day" allowDuplicatedCategory={false} tick={{ fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="category"
          name="Category"
          allowDuplicatedCategory={false}
          width={80}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          formatter={(value, name, props) => [
            `$${props.payload.z}`,
            `${props.payload.category} (${props.payload.day})`,
          ]}
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Scatter data={data} shape="square">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.z)} width={40} height={40} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}

