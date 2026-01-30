"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface LocationData {
  locationName: string
  totalHours: number
  visitCount: number
}

interface LocationPieChartProps {
  data: LocationData[]
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(142, 76%, 36%)",
  "hsl(var(--warning))",
  "hsl(221, 83%, 53%)",
  "hsl(262, 83%, 58%)",
  "hsl(0, 84%, 60%)",
  "hsl(32, 95%, 44%)",
]

export function LocationPieChart({ data }: LocationPieChartProps) {
  const chartData = data.map((loc) => ({
    name: loc.locationName,
    value: Number(loc.totalHours.toFixed(1)),
    visits: loc.visitCount,
  }))

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label={((props: any) => `${props.name ?? ""} (${((props.percent ?? 0) * 100).toFixed(0)}%)`) as never}
          labelLine={{ strokeWidth: 1 }}
        >
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={((value: any, name: any) => [`${value ?? 0}h`, name]) as never}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
