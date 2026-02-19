"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Coffee,
  Sun,
  Moon,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  MapPin,
  Timer,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ProgressRing, Sparkline } from "@/components/analytics/enterprise-charts"

// ─────────────────────────────────────────────────────────────────────────────
// GOALS WIDGET - Track daily/weekly targets
// ─────────────────────────────────────────────────────────────────────────────

interface GoalsWidgetProps {
  todayHours: number
  todayTarget?: number
  weeklyHours: number
  weeklyTarget?: number
  daysWorked: number
  requiredDays: number
}

export function GoalsWidget({
  todayHours,
  todayTarget = 8,
  weeklyHours,
  weeklyTarget = 40,
  daysWorked,
  requiredDays,
}: GoalsWidgetProps) {
  const todayProgress = Math.min(100, (todayHours / todayTarget) * 100)
  const weeklyProgress = Math.min(100, (weeklyHours / weeklyTarget) * 100)
  const daysProgress = Math.min(100, (daysWorked / requiredDays) * 100)

  const goals = [
    {
      label: "Today",
      current: todayHours,
      target: todayTarget,
      unit: "h",
      progress: todayProgress,
      color: todayProgress >= 100 ? "#10b981" : todayProgress >= 75 ? "#3b82f6" : "#f59e0b",
      icon: <Clock className="h-4 w-4" />,
    },
    {
      label: "This Week",
      current: weeklyHours,
      target: weeklyTarget,
      unit: "h",
      progress: weeklyProgress,
      color: weeklyProgress >= 100 ? "#10b981" : weeklyProgress >= 75 ? "#3b82f6" : "#f59e0b",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      label: "Days",
      current: daysWorked,
      target: requiredDays,
      unit: "",
      progress: daysProgress,
      color: daysProgress >= 100 ? "#10b981" : daysProgress >= 66 ? "#3b82f6" : "#f59e0b",
      icon: <Target className="h-4 w-4" />,
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Goals Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal, i) => (
          <motion.div
            key={goal.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span style={{ color: goal.color }}>{goal.icon}</span>
                <span className="text-sm font-medium">{goal.label}</span>
              </div>
              <span className="text-sm tabular-nums">
                <span className="font-semibold">{goal.current}</span>
                <span className="text-muted-foreground">/{goal.target}{goal.unit}</span>
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: goal.color }}
                initial={{ width: 0 }}
                animate={{ width: `${goal.progress}%` }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              />
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WORK BALANCE WIDGET - Time distribution analysis
// ─────────────────────────────────────────────────────────────────────────────

interface WorkBalanceWidgetProps {
  weekSummary?: {
    weekDays?: Array<{
      minutes: number
      locationCategory?: string
    }>
  } | null
  averageStartTime?: string
  averageEndTime?: string
}

export function WorkBalanceWidget({ weekSummary, averageStartTime = "9:00 AM", averageEndTime = "5:30 PM" }: WorkBalanceWidgetProps) {
  const weekDays = weekSummary?.weekDays || []

  // Calculate metrics
  const onsiteHours = weekDays
    .filter(d => d.locationCategory === "OFFICE")
    .reduce((sum, d) => sum + d.minutes, 0) / 60

  const remoteHours = weekDays
    .filter(d => d.locationCategory === "HOME")
    .reduce((sum, d) => sum + d.minutes, 0) / 60

  const totalHours = onsiteHours + remoteHours
  const onsitePercent = totalHours > 0 ? Math.round((onsiteHours / totalHours) * 100) : 50
  const remotePercent = 100 - onsitePercent

  // Overtime calculation
  const overtimeHours = Math.max(0, totalHours - 40)
  const isOverworked = overtimeHours > 5

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Work Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Split */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Location Split</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden">
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
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Office {onsitePercent}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Remote {remotePercent}%
            </span>
          </div>
        </div>

        {/* Work Schedule */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Sun className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs text-muted-foreground">Avg Start</span>
            </div>
            <p className="text-sm font-semibold">{averageStartTime}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Moon className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-xs text-muted-foreground">Avg End</span>
            </div>
            <p className="text-sm font-semibold">{averageEndTime}</p>
          </div>
        </div>

        {/* Overtime Alert */}
        {overtimeHours > 0 && (
          <div className={cn(
            "p-3 rounded-lg flex items-center gap-3",
            isOverworked ? "bg-amber-500/10" : "bg-muted/50"
          )}>
            <Timer className={cn("h-4 w-4", isOverworked ? "text-amber-500" : "text-muted-foreground")} />
            <div className="flex-1">
              <p className={cn("text-sm font-medium", isOverworked && "text-amber-600 dark:text-amber-400")}>
                {overtimeHours.toFixed(1)}h overtime
              </p>
              <p className="text-xs text-muted-foreground">this week</p>
            </div>
            {isOverworked && (
              <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-xs">
                High
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WELLNESS INDICATOR - Burnout risk assessment
// ─────────────────────────────────────────────────────────────────────────────

interface WellnessIndicatorProps {
  consecutiveWorkDays?: number
  avgDailyHours?: number
  breaksTaken?: number
  overtimeHours?: number
}

export function WellnessIndicator({
  consecutiveWorkDays = 3,
  avgDailyHours = 7.5,
  breaksTaken = 2,
  overtimeHours = 0,
}: WellnessIndicatorProps) {
  // Calculate wellness score (0-100)
  let score = 100

  // Deduct for consecutive work days
  if (consecutiveWorkDays > 5) score -= 20
  else if (consecutiveWorkDays > 3) score -= 10

  // Deduct for long hours
  if (avgDailyHours > 10) score -= 25
  else if (avgDailyHours > 9) score -= 15
  else if (avgDailyHours > 8) score -= 5

  // Deduct for low breaks
  if (breaksTaken < 1) score -= 15
  else if (breaksTaken < 2) score -= 5

  // Deduct for overtime
  if (overtimeHours > 10) score -= 20
  else if (overtimeHours > 5) score -= 10

  score = Math.max(0, score)

  const getStatus = () => {
    if (score >= 80) return { label: "Healthy", color: "text-emerald-600", bg: "bg-emerald-500/10", ring: "#10b981" }
    if (score >= 60) return { label: "Fair", color: "text-amber-600", bg: "bg-amber-500/10", ring: "#f59e0b" }
    return { label: "At Risk", color: "text-red-600", bg: "bg-red-500/10", ring: "#ef4444" }
  }

  const status = getStatus()

  const factors = [
    { label: "Work streak", value: `${consecutiveWorkDays} days`, good: consecutiveWorkDays <= 5 },
    { label: "Avg hours", value: `${avgDailyHours}h/day`, good: avgDailyHours <= 8 },
    { label: "Breaks", value: `${breaksTaken}/day`, good: breaksTaken >= 2 },
    { label: "Overtime", value: `${overtimeHours}h`, good: overtimeHours <= 5 },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Wellness Check
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <ProgressRing
            value={score}
            max={100}
            size={64}
            strokeWidth={6}
            color={status.ring}
            label={<span className="text-lg font-bold">{score}</span>}
          />
          <div>
            <p className={cn("font-semibold", status.color)}>{status.label}</p>
            <p className="text-xs text-muted-foreground">Wellness score</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {factors.map((f, i) => (
            <div
              key={i}
              className={cn(
                "p-2 rounded-lg text-xs",
                f.good ? "bg-emerald-500/10" : "bg-amber-500/10"
              )}
            >
              <div className="flex items-center gap-1.5">
                {f.good ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                )}
                <span className="text-muted-foreground">{f.label}</span>
              </div>
              <p className="font-medium mt-0.5">{f.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK METRICS ROW - Key stats in a horizontal row
// ─────────────────────────────────────────────────────────────────────────────

interface QuickMetric {
  label: string
  value: string | number
  subValue?: string
  icon: React.ReactNode
  trend?: "up" | "down" | "neutral"
  color?: string
}

interface QuickMetricsRowProps {
  metrics: QuickMetric[]
}

export function QuickMetricsRow({ metrics }: QuickMetricsRowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {metrics.map((metric, i) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="relative overflow-hidden rounded-xl border bg-card p-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
              <p className={cn("text-2xl font-bold mt-1", metric.color)}>
                {metric.value}
              </p>
              {metric.subValue && (
                <div className={cn(
                  "flex items-center gap-1 mt-1 text-xs",
                  metric.trend === "up" && "text-emerald-600",
                  metric.trend === "down" && "text-red-600",
                  !metric.trend && "text-muted-foreground"
                )}>
                  {metric.trend === "up" && <ArrowUpRight className="h-3 w-3" />}
                  {metric.trend === "down" && <ArrowDownRight className="h-3 w-3" />}
                  {metric.subValue}
                </div>
              )}
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              {metric.icon}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STREAK WIDGET - Current streak with milestones
// ─────────────────────────────────────────────────────────────────────────────

interface StreakWidgetProps {
  currentStreak: number
  longestStreak?: number
  nextMilestone?: number
}

export function StreakWidget({
  currentStreak,
  longestStreak = 10,
  nextMilestone = 7,
}: StreakWidgetProps) {
  const milestones = [3, 5, 7, 14, 21, 30]
  const nextGoal = milestones.find(m => m > currentStreak) || currentStreak + 7
  const progress = Math.min(100, (currentStreak / nextGoal) * 100)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Work Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <ProgressRing
              value={currentStreak}
              max={nextGoal}
              size={72}
              strokeWidth={6}
              color="#f97316"
              label={
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold text-orange-500">{currentStreak}</span>
                </div>
              }
              sublabel="days"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {currentStreak === 0 ? "Start your streak!" : `${nextGoal - currentStreak} days to ${nextGoal}-day goal`}
            </p>
            <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Longest: {longestStreak} days
            </p>
          </div>
        </div>

        {/* Milestone badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {milestones.slice(0, 5).map((m) => (
            <Badge
              key={m}
              variant={currentStreak >= m ? "default" : "outline"}
              className={cn(
                "text-xs",
                currentStreak >= m
                  ? "bg-orange-500/10 text-orange-600 border-orange-500/30"
                  : "text-muted-foreground"
              )}
            >
              {m}d
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
