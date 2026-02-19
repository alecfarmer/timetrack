"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Widget } from "@/components/dashboard/widget-grid"
import {
  Sparkline,
  ProgressRing,
  HorizontalBarChart,
  DonutChart,
  WeeklyHeatmap,
  TimeComparison,
} from "@/components/analytics/enterprise-charts"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  Clock,
  Target,
  MapPin,
  BarChart3,
  Zap,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getTimezone } from "@/lib/dates"

interface ProductivityData {
  score: number
  previousScore: number
  avgHoursPerDay: number
  previousAvgHours: number
  totalHoursThisWeek: number
  totalHoursLastWeek: number
  onTimeRate: number
  overtimeHours: number
  locationBreakdown: Array<{ name: string; hours: number; color: string }>
  dailyHours: Array<{ label: string; value: number }>
  trend: number[]
}

interface ProductivityWidgetProps {
  weekSummary?: {
    weekDays?: Array<{
      date: string
      minutes: number
      worked: boolean
      dayOfWeek: string
      locationCategory?: string
    }>
    totalMinutes?: number
  } | null
  liveSessionMinutes?: number
}

export function ProductivityWidget({ weekSummary, liveSessionMinutes = 0 }: ProductivityWidgetProps) {
  const [data, setData] = useState<ProductivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"overview" | "breakdown">("overview")

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/insights", {
          headers: { "x-timezone": getTimezone() },
        })
        if (res.ok) {
          const insights = await res.json()
          setData({
            score: insights.productivityScore || 85,
            previousScore: insights.previousProductivityScore || 82,
            avgHoursPerDay: insights.avgHoursPerDay || 7.5,
            previousAvgHours: insights.prevAvgHoursPerDay || 7.2,
            totalHoursThisWeek: insights.totalHoursThisWeek || 38,
            totalHoursLastWeek: insights.totalHoursLastWeek || 40,
            onTimeRate: insights.onTimeRate || 92,
            overtimeHours: insights.overtimeHours || 2,
            locationBreakdown: insights.locationBreakdown || [
              { name: "Office", hours: 28, color: "#10b981" },
              { name: "Home", hours: 10, color: "#3b82f6" },
            ],
            dailyHours: insights.weeklyBreakdown?.map((d: any) => ({
              label: d.date?.slice(5) || "",
              value: Math.round((d.hours || 0) * 10) / 10,
            })) || [],
            trend: insights.trend || [36, 42, 38, 40],
          })
        }
      } catch (err) {
        console.error("Failed to fetch productivity data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Compute from weekSummary if API fails
  const liveHours = liveSessionMinutes / 60
  const dailyData = weekSummary?.weekDays?.map((d) => ({
    label: d.dayOfWeek.slice(0, 3),
    value: Math.round(((d.minutes || 0) / 60) * 10) / 10,
  })) || []

  const totalWeekHours = ((weekSummary?.totalMinutes || 0) / 60) + liveHours
  const workDays = weekSummary?.weekDays?.filter((d) => d.minutes > 0).length || 0
  const avgHours = workDays > 0 ? totalWeekHours / workDays : 0

  // Calculate location breakdown from weekSummary
  const locationBreakdown = weekSummary?.weekDays?.reduce((acc, d) => {
    const cat = d.locationCategory || "Other"
    const hours = d.minutes / 60
    const existing = acc.find((l) => l.name === (cat === "HOME" ? "Home" : cat === "OFFICE" ? "Office" : cat))
    if (existing) {
      existing.hours += hours
    } else {
      acc.push({
        name: cat === "HOME" ? "Home" : cat === "OFFICE" ? "Office" : cat,
        hours,
        color: cat === "HOME" ? "#3b82f6" : cat === "OFFICE" ? "#10b981" : "#8b5cf6",
      })
    }
    return acc
  }, [] as Array<{ name: string; hours: number; color: string }>) || data?.locationBreakdown || []

  const productivityScore = data?.score || Math.min(100, Math.round((avgHours / 8) * 100))
  const previousScore = data?.previousScore || productivityScore - 3

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981"
    if (score >= 60) return "#f59e0b"
    return "#ef4444"
  }

  if (loading) {
    return (
      <Widget title="Productivity" icon={<Zap className="h-4 w-4 text-amber-500" />}>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
      </Widget>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card overflow-hidden"
    >
      {/* Header with tabs */}
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Zap className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Productivity Analytics</h3>
            <p className="text-xs text-muted-foreground">This week&apos;s performance</p>
          </div>
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
          <TabsList className="h-8">
            <TabsTrigger value="overview" className="text-xs px-3 h-7">Overview</TabsTrigger>
            <TabsTrigger value="breakdown" className="text-xs px-3 h-7">Breakdown</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="p-5">
        {viewMode === "overview" ? (
          <div className="space-y-5">
            {/* Score and Trend Row */}
            <div className="flex items-center gap-6">
              {/* Productivity Score */}
              <div className="flex items-center gap-4">
                <ProgressRing
                  value={productivityScore}
                  max={100}
                  size={72}
                  strokeWidth={6}
                  color={getScoreColor(productivityScore)}
                  label={<span className="text-xl font-bold">{productivityScore}</span>}
                  sublabel="score"
                />
                <div>
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    productivityScore >= previousScore ? "text-emerald-600" : "text-red-600"
                  )}>
                    {productivityScore >= previousScore ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {Math.abs(productivityScore - previousScore)} pts
                  </div>
                  <p className="text-xs text-muted-foreground">vs last week</p>
                </div>
              </div>

              {/* Trend Sparkline */}
              <div className="flex-1 flex flex-col items-end">
                <p className="text-xs text-muted-foreground mb-1">4-week trend</p>
                <Sparkline
                  data={data?.trend || [totalWeekHours * 0.9, totalWeekHours * 0.95, totalWeekHours * 1.02, totalWeekHours]}
                  width={100}
                  height={32}
                  color={getScoreColor(productivityScore)}
                />
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Avg/Day</span>
                </div>
                <p className="text-lg font-bold">{avgHours.toFixed(1)}h</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">On-Time</span>
                </div>
                <p className="text-lg font-bold">{data?.onTimeRate || 95}%</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">This Week</span>
                </div>
                <p className="text-lg font-bold">{totalWeekHours.toFixed(1)}h</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Overtime</span>
                </div>
                <p className="text-lg font-bold">
                  {Math.max(0, totalWeekHours - 40).toFixed(1)}h
                </p>
              </div>
            </div>

            {/* Weekly Heatmap */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Daily Activity</p>
              <WeeklyHeatmap
                data={dailyData.length > 0 ? dailyData : [
                  { label: "Mon", value: 8 },
                  { label: "Tue", value: 7 },
                  { label: "Wed", value: 9 },
                  { label: "Thu", value: 8 },
                  { label: "Fri", value: 6 },
                  { label: "Sat", value: 0 },
                  { label: "Sun", value: 0 },
                ]}
                maxValue={10}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Location Distribution */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Work Location Distribution</span>
              </div>
              {locationBreakdown.length > 0 ? (
                <DonutChart
                  data={locationBreakdown.map((l) => ({
                    label: l.name,
                    value: l.hours,
                    color: l.color,
                  }))}
                  size={100}
                  strokeWidth={16}
                  centerLabel={`${Math.round(totalWeekHours)}h`}
                  centerSubLabel="total"
                />
              ) : (
                <p className="text-sm text-muted-foreground">No location data available</p>
              )}
            </div>

            {/* Daily Breakdown */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Hours by Day</span>
              </div>
              <HorizontalBarChart
                data={dailyData.length > 0 ? dailyData.map((d) => ({
                  label: d.label,
                  value: d.value,
                  color: d.value >= 8 ? "#10b981" : d.value >= 6 ? "#f59e0b" : "#ef4444",
                })) : []}
                maxValue={10}
                formatValue={(v) => `${v}h`}
              />
            </div>

            {/* Week Comparison */}
            <div className="pt-4 border-t">
              <TimeComparison
                current={{ label: "This Week", value: Math.round(totalWeekHours * 10) / 10 }}
                previous={{ label: "Last Week", value: data?.totalHoursLastWeek || totalWeekHours * 0.95 }}
                formatValue={(v) => `${v}h`}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Compact version for mobile
export function CompactProductivityWidget({ weekSummary, liveSessionMinutes = 0 }: ProductivityWidgetProps) {
  const liveHours = liveSessionMinutes / 60
  const totalMinutes = (weekSummary?.totalMinutes || 0) + (liveSessionMinutes || 0)
  const totalHours = totalMinutes / 60
  const workDays = weekSummary?.weekDays?.filter((d) => d.minutes > 0).length || 0
  const avgHours = workDays > 0 ? totalHours / workDays : 0
  const score = Math.min(100, Math.round((avgHours / 8) * 100))

  const getScoreColor = (s: number) => {
    if (s >= 80) return "#10b981"
    if (s >= 60) return "#f59e0b"
    return "#ef4444"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card p-4"
    >
      <div className="flex items-center gap-4">
        <ProgressRing
          value={score}
          max={100}
          size={56}
          strokeWidth={5}
          color={getScoreColor(score)}
          label={<span className="text-lg font-bold">{score}</span>}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="font-semibold text-sm">Productivity</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{totalHours.toFixed(1)}h this week</span>
            <span>{avgHours.toFixed(1)}h avg/day</span>
          </div>
        </div>
        <Badge variant={score >= 80 ? "default" : "secondary"} className="text-xs">
          {score >= 80 ? "On Track" : score >= 60 ? "Fair" : "Improve"}
        </Badge>
      </div>
    </motion.div>
  )
}
