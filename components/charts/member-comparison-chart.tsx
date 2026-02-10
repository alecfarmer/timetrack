"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface MemberData {
  email: string
  totalHours: number
  complianceRate: number
}

interface MemberComparisonChartProps {
  data: MemberData[]
}

export function MemberComparisonChart({ data }: MemberComparisonChartProps) {
  const chartData = data
    .slice(0, 10)
    .map((m) => ({
      name: m.email.split("@")[0],
      hours: Number(m.totalHours.toFixed(1)),
      compliance: Math.round(m.complianceRate),
    }))
    .sort((a, b) => b.hours - a.hours)

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} className="text-muted-foreground" width={80} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={((value: any, name: any) => [
            name === "hours" ? `${value ?? 0}h` : `${value ?? 0}%`,
            name === "hours" ? "Hours Worked" : "Compliance",
          ]) as never}
        />
        <Bar dataKey="hours" radius={[0, 4, 4, 0]} maxBarSize={24}>
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.compliance >= 80 ? "hsl(var(--success))" : entry.compliance >= 50 ? "hsl(var(--primary))" : "hsl(var(--destructive))"} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
