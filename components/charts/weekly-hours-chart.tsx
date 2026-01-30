"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface WeeklyData {
  weekStart: string
  totalHours: number
  avgHoursPerMember: number
  complianceRate: number
}

interface WeeklyHoursChartProps {
  data: WeeklyData[]
}

export function WeeklyHoursChart({ data }: WeeklyHoursChartProps) {
  const chartData = data.map((w) => ({
    name: new Date(w.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    hours: Number(w.totalHours.toFixed(1)),
    compliance: Math.round(w.complianceRate),
  }))

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
        <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
          labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={((value: any, name: any) => [
            name === "hours" ? `${value ?? 0}h` : `${value ?? 0}%`,
            name === "hours" ? "Total Hours" : "Compliance",
          ]) as never}
        />
        <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.compliance >= 80 ? "hsl(var(--success))" : "hsl(var(--primary))"} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
