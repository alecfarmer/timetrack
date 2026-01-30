"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

interface WeeklyData {
  weekStart: string
  complianceRate: number
  memberCount: number
}

interface ComplianceTrendChartProps {
  data: WeeklyData[]
}

export function ComplianceTrendChart({ data }: ComplianceTrendChartProps) {
  const chartData = data.map((w) => ({
    name: new Date(w.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    compliance: Math.round(w.complianceRate),
    members: w.memberCount,
  }))

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v) => `${v}%`} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={((value: any) => [`${value ?? 0}%`, "Compliance"]) as never}
        />
        <ReferenceLine y={80} stroke="hsl(var(--success))" strokeDasharray="3 3" label={{ value: "Target 80%", position: "right", fontSize: 10 }} />
        <Line type="monotone" dataKey="compliance" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
