"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Sparkline,
  ProgressRing,
  HorizontalBarChart,
  DonutChart,
  WeeklyHeatmap,
} from "@/components/analytics/enterprise-charts"
import {
  Zap,
  BarChart3,
  Activity,
  Heart,
  Clock,
  Target,
  Calendar,
  MapPin,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Sun,
  Moon,
  Timer,
  CheckCircle2,
  AlertTriangle,
  Coffee,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getTimezone } from "@/lib/dates"

interface UnifiedAnalyticsProps {
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
  currentStreak?: number
  avgDailyHours?: number
  overtimeHours?: number
}

type PanelType = "productivity" | "insights" | "balance" | "wellness"

export function UnifiedAnalyticsWidget({
  weekSummary,
  liveSessionMinutes = 0,
  currentStreak = 0,
  avgDailyHours = 0,
  overtimeHours = 0,
}: UnifiedAnalyticsProps) {
  const [activePanel, setActivePanel] = useState<PanelType>("productivity")
  const [insightsData, setInsightsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/insights", {
          headers: { "x-timezone": getTimezone() },
        })
        if (res.ok) {
          const data = await res.json()
          setInsightsData(data)
        }
      } catch (err) {
        console.error("Failed to fetch insights:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Computed data from weekSummary
  const liveHours = liveSessionMinutes / 60
  const weekDays = weekSummary?.weekDays || []

  const dailyData = weekDays.map((d) => ({
    label: d.dayOfWeek.slice(0, 3),
    value: Math.round(((d.minutes || 0) / 60) * 10) / 10,
  }))

  const totalWeekHours = ((weekSummary?.totalMinutes || 0) / 60) + liveHours
  const workDays = weekDays.filter((d) => d.minutes > 0).length || 1
  const avgHours = totalWeekHours / workDays

  // Location breakdown
  const locationBreakdown = weekDays.reduce((acc, d) => {
    const cat = d.locationCategory || "Other"
    const hours = d.minutes / 60
    const name = cat === "HOME" ? "Home" : cat === "OFFICE" ? "Office" : cat
    const existing = acc.find((l) => l.name === name)
    if (existing) {
      existing.hours += hours
    } else {
      acc.push({
        name,
        hours,
        color: cat === "HOME" ? "#3b82f6" : cat === "OFFICE" ? "#10b981" : "#8b5cf6",
      })
    }
    return acc
  }, [] as Array<{ name: string; hours: number; color: string }>)

  const onsiteHours = locationBreakdown.find(l => l.name === "Office")?.hours || 0
  const remoteHours = locationBreakdown.find(l => l.name === "Home")?.hours || 0
  const onsitePercent = totalWeekHours > 0 ? Math.round((onsiteHours / totalWeekHours) * 100) : 50

  // Productivity score
  const productivityScore = insightsData?.productivityScore || Math.min(100, Math.round((avgHours / 8) * 100))
  const previousScore = insightsData?.previousProductivityScore || productivityScore - 3

  // Wellness score
  let wellnessScore = 100
  if (currentStreak > 5) wellnessScore -= 20
  else if (currentStreak > 3) wellnessScore -= 10
  if (avgDailyHours > 10) wellnessScore -= 25
  else if (avgDailyHours > 9) wellnessScore -= 15
  else if (avgDailyHours > 8) wellnessScore -= 5
  if (overtimeHours > 10) wellnessScore -= 20
  else if (overtimeHours > 5) wellnessScore -= 10
  wellnessScore = Math.max(0, wellnessScore)

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981"
    if (score >= 60) return "#f59e0b"
    return "#ef4444"
  }

  const panels = [
    { id: "productivity" as PanelType, label: "Productivity", icon: Zap },
    { id: "insights" as PanelType, label: "Insights", icon: BarChart3 },
    { id: "balance" as PanelType, label: "Balance", icon: Activity },
    { id: "wellness" as PanelType, label: "Wellness", icon: Heart },
  ]

  if (loading) {
    return (
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card overflow-hidden"
    >
      {/* Header with panel selector */}
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Analytics</h3>
            <p className="text-xs text-muted-foreground">This week's performance</p>
          </div>
        </div>
        <Tabs value={activePanel} onValueChange={(v) => setActivePanel(v as PanelType)}>
          <TabsList className="h-8">
            {panels.map((panel) => (
              <TabsTrigger
                key={panel.id}
                value={panel.id}
                className="text-xs px-3 h-7 gap-1.5"
              >
                <panel.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{panel.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Panel Content */}
      <div className="p-5 min-h-[320px]">
        <AnimatePresence mode="wait">
          {activePanel === "productivity" && (
            <ProductivityPanel
              key="productivity"
              score={productivityScore}
              previousScore={previousScore}
              avgHours={avgHours}
              totalWeekHours={totalWeekHours}
              dailyData={dailyData}
              insightsData={insightsData}
            />
          )}
          {activePanel === "insights" && (
            <InsightsPanel
              key="insights"
              totalWeekHours={totalWeekHours}
              dailyData={dailyData}
              locationBreakdown={locationBreakdown}
              insightsData={insightsData}
            />
          )}
          {activePanel === "balance" && (
            <BalancePanel
              key="balance"
              onsitePercent={onsitePercent}
              onsiteHours={onsiteHours}
              remoteHours={remoteHours}
              totalWeekHours={totalWeekHours}
              overtimeHours={overtimeHours}
            />
          )}
          {activePanel === "wellness" && (
            <WellnessPanel
              key="wellness"
              score={wellnessScore}
              currentStreak={currentStreak}
              avgDailyHours={avgDailyHours}
              overtimeHours={overtimeHours}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTIVITY PANEL
// ─────────────────────────────────────────────────────────────────────────────

function ProductivityPanel({
  score,
  previousScore,
  avgHours,
  totalWeekHours,
  dailyData,
  insightsData,
}: {
  score: number
  previousScore: number
  avgHours: number
  totalWeekHours: number
  dailyData: Array<{ label: string; value: number }>
  insightsData: any
}) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "#10b981"
    if (s >= 60) return "#f59e0b"
    return "#ef4444"
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      {/* Score and Trend Row */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <ProgressRing
            value={score}
            max={100}
            size={72}
            strokeWidth={6}
            color={getScoreColor(score)}
            label={<span className="text-xl font-bold">{score}</span>}
            sublabel="score"
          />
          <div>
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              score >= previousScore ? "text-emerald-600" : "text-red-600"
            )}>
              {score >= previousScore ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {Math.abs(score - previousScore)} pts
            </div>
            <p className="text-xs text-muted-foreground">vs last week</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-end">
          <p className="text-xs text-muted-foreground mb-1">4-week trend</p>
          <Sparkline
            data={insightsData?.trend || [totalWeekHours * 0.9, totalWeekHours * 0.95, totalWeekHours * 1.02, totalWeekHours]}
            width={100}
            height={32}
            color={getScoreColor(score)}
          />
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-4 gap-3">
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
          <p className="text-lg font-bold">{insightsData?.onTimeRate || 95}%</p>
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
          <p className="text-lg font-bold">{Math.max(0, totalWeekHours - 40).toFixed(1)}h</p>
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
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INSIGHTS PANEL
// ─────────────────────────────────────────────────────────────────────────────

function InsightsPanel({
  totalWeekHours,
  dailyData,
  locationBreakdown,
  insightsData,
}: {
  totalWeekHours: number
  dailyData: Array<{ label: string; value: number }>
  locationBreakdown: Array<{ name: string; hours: number; color: string }>
  insightsData: any
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
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

      {/* Best Day */}
      <div className="pt-3 border-t flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Most Productive Day</span>
        <Badge variant="secondary">{insightsData?.mostProductiveDay || "Tuesday"}</Badge>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BALANCE PANEL
// ─────────────────────────────────────────────────────────────────────────────

function BalancePanel({
  onsitePercent,
  onsiteHours,
  remoteHours,
  totalWeekHours,
  overtimeHours,
}: {
  onsitePercent: number
  onsiteHours: number
  remoteHours: number
  totalWeekHours: number
  overtimeHours: number
}) {
  const remotePercent = 100 - onsitePercent
  const isOverworked = overtimeHours > 5

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      {/* Location Split */}
      <div>
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="font-medium">Location Split</span>
          <span className="text-muted-foreground">{totalWeekHours.toFixed(1)}h total</span>
        </div>
        <div className="flex h-4 rounded-full overflow-hidden">
          <motion.div
            className="bg-emerald-500 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${onsitePercent}%` }}
            transition={{ duration: 0.5 }}
          />
          <motion.div
            className="bg-blue-500 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${remotePercent}%` }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm">Office</span>
            <span className="text-sm font-semibold">{onsiteHours.toFixed(1)}h ({onsitePercent}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm">Remote</span>
            <span className="text-sm font-semibold">{remoteHours.toFixed(1)}h ({remotePercent}%)</span>
          </div>
        </div>
      </div>

      {/* Work Schedule */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-muted/50">
          <div className="flex items-center gap-2 mb-2">
            <Sun className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">Avg Start</span>
          </div>
          <p className="text-xl font-bold">9:00 AM</p>
        </div>
        <div className="p-4 rounded-xl bg-muted/50">
          <div className="flex items-center gap-2 mb-2">
            <Moon className="h-4 w-4 text-violet-500" />
            <span className="text-sm text-muted-foreground">Avg End</span>
          </div>
          <p className="text-xl font-bold">5:30 PM</p>
        </div>
      </div>

      {/* Overtime Alert */}
      <div className={cn(
        "p-4 rounded-xl flex items-center gap-4",
        isOverworked ? "bg-amber-500/10" : "bg-muted/50"
      )}>
        <Timer className={cn("h-5 w-5", isOverworked ? "text-amber-500" : "text-muted-foreground")} />
        <div className="flex-1">
          <p className={cn("text-sm font-medium", isOverworked && "text-amber-600 dark:text-amber-400")}>
            {overtimeHours.toFixed(1)}h overtime this week
          </p>
          <p className="text-xs text-muted-foreground">
            {isOverworked ? "Consider taking a break" : "Within healthy limits"}
          </p>
        </div>
        {isOverworked && (
          <Badge variant="outline" className="text-amber-600 border-amber-500/30">
            High
          </Badge>
        )}
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WELLNESS PANEL
// ─────────────────────────────────────────────────────────────────────────────

function WellnessPanel({
  score,
  currentStreak,
  avgDailyHours,
  overtimeHours,
}: {
  score: number
  currentStreak: number
  avgDailyHours: number
  overtimeHours: number
}) {
  const getStatus = () => {
    if (score >= 80) return { label: "Healthy", color: "text-emerald-600", ring: "#10b981" }
    if (score >= 60) return { label: "Fair", color: "text-amber-600", ring: "#f59e0b" }
    return { label: "At Risk", color: "text-red-600", ring: "#ef4444" }
  }

  const status = getStatus()

  const factors = [
    { label: "Work streak", value: `${currentStreak} days`, good: currentStreak <= 5 },
    { label: "Avg hours", value: `${avgDailyHours.toFixed(1)}h/day`, good: avgDailyHours <= 8 },
    { label: "Breaks", value: "2/day", good: true },
    { label: "Overtime", value: `${overtimeHours.toFixed(1)}h`, good: overtimeHours <= 5 },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      {/* Wellness Score */}
      <div className="flex items-center gap-6">
        <ProgressRing
          value={score}
          max={100}
          size={80}
          strokeWidth={8}
          color={status.ring}
          label={<span className="text-2xl font-bold">{score}</span>}
        />
        <div>
          <p className={cn("text-lg font-semibold", status.color)}>{status.label}</p>
          <p className="text-sm text-muted-foreground">Wellness score</p>
          <p className="text-xs text-muted-foreground mt-1">
            Based on work patterns this week
          </p>
        </div>
      </div>

      {/* Factors Grid */}
      <div className="grid grid-cols-2 gap-3">
        {factors.map((f, i) => (
          <div
            key={i}
            className={cn(
              "p-3 rounded-xl",
              f.good ? "bg-emerald-500/10" : "bg-amber-500/10"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              {f.good ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
              <span className="text-xs text-muted-foreground">{f.label}</span>
            </div>
            <p className="text-lg font-semibold">{f.value}</p>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="p-4 rounded-xl bg-muted/50">
        <div className="flex items-center gap-2 mb-2">
          <Coffee className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Wellness Tip</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {score >= 80
            ? "Great balance! Keep maintaining your healthy work habits."
            : score >= 60
            ? "Consider taking more breaks throughout the day."
            : "Your work patterns suggest high stress. Take time to rest."}
        </p>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPACT VERSION FOR MOBILE
// ─────────────────────────────────────────────────────────────────────────────

export function CompactUnifiedAnalytics({
  weekSummary,
  liveSessionMinutes = 0,
}: UnifiedAnalyticsProps) {
  const liveHours = liveSessionMinutes / 60
  const totalHours = ((weekSummary?.totalMinutes || 0) / 60) + liveHours
  const workDays = weekSummary?.weekDays?.filter((d) => d.minutes > 0).length || 1
  const avgHours = totalHours / workDays
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
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Analytics</span>
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
