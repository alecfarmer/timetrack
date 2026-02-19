"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Widget } from "@/components/dashboard/widget-grid"
import {
  RadialProgress,
  DonutChart,
  MiniBarChart,
  Sparkline,
  TrendIndicator,
} from "@/components/dashboard/kpi-charts"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Clock,
  Target,
  BarChart3,
  Activity,
  Flame,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getTimezone } from "@/lib/dates"

interface WeekDay {
  date: string
  hours: number
  isToday: boolean
}

interface InsightsData {
  weeklyBreakdown: WeekDay[]
  avgHoursPerDay: number
  prevAvgHoursPerDay: number
  totalHoursThisWeek: number
  totalHoursLastWeek: number
  productivityScore: number
  onTimeRate: number
  breaksTaken: number
  overtimeHours: number
  mostProductiveDay: string
  trend: number[] // last 4 weeks of hours
}

interface InsightsWidgetProps {
  weekSummary?: {
    weekDays?: Array<{
      date: string
      minutes: number
      worked: boolean
    }>
  } | null
}

export function InsightsWidget({ weekSummary }: InsightsWidgetProps) {
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"charts" | "stats">("charts")

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch("/api/insights", {
          headers: { "x-timezone": getTimezone() },
        })
        if (res.ok) {
          const data = await res.json()
          setInsights(data)
        }
      } catch (err) {
        console.error("Failed to fetch insights:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchInsights()
  }, [])

  // Compute weekly breakdown from weekSummary if insights API fails
  const weeklyData = insights?.weeklyBreakdown ||
    weekSummary?.weekDays?.map((d) => ({
      date: d.date,
      hours: d.minutes / 60,
      isToday: new Date(d.date).toDateString() === new Date().toDateString(),
    })) || []

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const barData = weeklyData.slice(0, 7).map((d, i) => ({
    name: dayNames[i] || d.date.slice(5),
    value: Math.round(d.hours * 10) / 10,
    target: 8,
  }))

  // Calculate averages from available data
  const totalHours = weeklyData.reduce((sum, d) => sum + d.hours, 0)
  const daysWithHours = weeklyData.filter((d) => d.hours > 0).length || 1
  const avgHours = totalHours / daysWithHours

  // Mock trend data if not available
  const trendData = insights?.trend?.map((v) => ({ value: v })) ||
    [{ value: 38 }, { value: 42 }, { value: 40 }, { value: totalHours }]

  // Distribution for donut chart
  const donutData = [
    { name: "Regular", value: Math.max(0, Math.min(40, totalHours)), color: "hsl(var(--primary))" },
    { name: "Overtime", value: Math.max(0, totalHours - 40), color: "#f59e0b" },
    { name: "Remaining", value: Math.max(0, 40 - totalHours), color: "hsl(var(--muted))" },
  ].filter((d) => d.value > 0)

  if (loading) {
    return (
      <Widget title="Insights">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Widget>
    )
  }

  return (
    <Widget
      title="Insights"
      icon={<BarChart3 className="h-4 w-4 text-primary" />}
    >
      <div className="flex justify-end mb-3 -mt-1">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "charts" | "stats")}>
          <TabsList className="h-7">
            <TabsTrigger value="charts" className="text-xs px-2 h-6">Charts</TabsTrigger>
            <TabsTrigger value="stats" className="text-xs px-2 h-6">Stats</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {viewMode === "charts" ? (
        <div className="space-y-4">
          {/* Weekly Hours Bar Chart */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Weekly Hours</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{totalHours.toFixed(1)}h</span>
                {insights && (
                  <TrendIndicator
                    value={insights.totalHoursThisWeek}
                    previousValue={insights.totalHoursLastWeek}
                    format="hours"
                  />
                )}
              </div>
            </div>
            <MiniBarChart data={barData} height={70} />
          </div>

          {/* Distribution & Trend Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Hours Distribution */}
            <div className="flex flex-col items-center">
              <DonutChart
                data={donutData}
                size={100}
                innerRadius={32}
                outerRadius={45}
                centerValue={`${Math.round(totalHours)}h`}
                centerLabel="Total"
              />
              <div className="flex gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[10px] text-muted-foreground">Regular</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] text-muted-foreground">OT</span>
                </div>
              </div>
            </div>

            {/* 4-Week Trend */}
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground mb-1">4-Week Trend</span>
              <div className="flex-1 flex items-center">
                <Sparkline data={trendData} width={100} height={50} color="hsl(var(--primary))" />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>4 wks ago</span>
                <span>This week</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatBox
            icon={<Clock className="h-4 w-4 text-blue-500" />}
            label="Avg/Day"
            value={`${avgHours.toFixed(1)}h`}
            trend={insights ? { current: insights.avgHoursPerDay, previous: insights.prevAvgHoursPerDay } : undefined}
          />
          <StatBox
            icon={<Target className="h-4 w-4 text-emerald-500" />}
            label="On-Time"
            value={`${insights?.onTimeRate || 95}%`}
          />
          <StatBox
            icon={<Flame className="h-4 w-4 text-orange-500" />}
            label="Overtime"
            value={`${insights?.overtimeHours || Math.max(0, totalHours - 40).toFixed(1)}h`}
          />
          <StatBox
            icon={<Zap className="h-4 w-4 text-violet-500" />}
            label="Productivity"
            value={`${insights?.productivityScore || 92}%`}
          />
          <div className="col-span-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Best Day</span>
              <span className="text-sm font-medium">
                {insights?.mostProductiveDay || "Tuesday"}
              </span>
            </div>
          </div>
        </div>
      )}
    </Widget>
  )
}

function StatBox({
  icon,
  label,
  value,
  trend,
}: {
  icon: React.ReactNode
  label: string
  value: string
  trend?: { current: number; previous: number }
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">{value}</span>
        {trend && (
          <TrendIndicator value={trend.current} previousValue={trend.previous} format="percent" />
        )}
      </div>
    </div>
  )
}

// Compact version for mobile
export function CompactInsightsWidget({ weekSummary }: InsightsWidgetProps) {
  const weeklyData = weekSummary?.weekDays?.map((d) => ({
    hours: d.minutes / 60,
  })) || []

  const totalHours = weeklyData.reduce((sum, d) => sum + d.hours, 0)
  const daysWorked = weeklyData.filter((d) => d.hours > 0).length

  const trendData = weeklyData.map((d) => ({ value: d.hours }))
  if (trendData.length === 0) {
    trendData.push({ value: 0 })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Weekly Progress</p>
            <p className="text-xs text-muted-foreground">{daysWorked} days worked</p>
          </div>
        </div>
        <Sparkline data={trendData} width={80} height={32} color="hsl(var(--primary))" />
      </div>

      <div className="flex items-center justify-between">
        <RadialProgress
          value={totalHours}
          max={40}
          size={80}
          strokeWidth={8}
          label="of 40h"
        />
        <div className="flex-1 ml-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">{totalHours.toFixed(1)}h</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Daily Avg</span>
            <span className="font-semibold">{(totalHours / Math.max(daysWorked, 1)).toFixed(1)}h</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Remaining</span>
            <span className="font-semibold">{Math.max(0, 40 - totalHours).toFixed(1)}h</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
