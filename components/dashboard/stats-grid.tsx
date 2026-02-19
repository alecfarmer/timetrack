"use client"

import { motion } from "framer-motion"
import { staggerContainer, staggerChild } from "@/lib/animations"
import { Clock, Calendar, Target, Flame, CheckCircle2, Sparkles, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsGridProps {
  todayHours: number
  todayMinutes: number
  todayProgress: number
  weeklyHours: number
  daysWorked: number
  requiredDays: number
  compliancePercent: number
  isCompliant: boolean
  currentStreak: number
}

// Circular progress ring component
function CircularProgress({
  value,
  max,
  size = 44,
  strokeWidth = 4,
  color,
}: {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(value / max, 1)
  const offset = circumference - progress * circumference

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/30"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={color}
      />
    </svg>
  )
}

// Mobile stat card with circular progress
function StatCard({
  icon,
  iconColor,
  label,
  value,
  subValue,
  progress,
  progressMax,
  progressColor,
  badge,
  highlight,
}: {
  icon: React.ReactNode
  iconColor: string
  label: string
  value: string
  subValue?: string
  progress?: number
  progressMax?: number
  progressColor?: string
  badge?: React.ReactNode
  highlight?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative rounded-2xl border bg-card p-4 overflow-hidden",
        highlight && "ring-2 ring-primary/20"
      )}
    >
      {highlight && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      )}
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", iconColor)}>
            {icon}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-bold tabular-nums">{value}</span>
            {badge}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
          {subValue && (
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">{subValue}</p>
          )}
        </div>
        {progress !== undefined && progressMax !== undefined && (
          <div className={cn("flex-shrink-0", progressColor)}>
            <CircularProgress
              value={progress}
              max={progressMax}
              color={progressColor || "text-primary"}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function StatsGrid({
  todayHours,
  todayMinutes,
  todayProgress,
  weeklyHours,
  daysWorked,
  requiredDays,
  compliancePercent,
  isCompliant,
  currentStreak,
}: StatsGridProps) {
  const overtimeHours = Math.max(0, weeklyHours - 40)
  const hasOvertime = overtimeHours > 0

  return (
    <>
      {/* Mobile: 2x2 card grid */}
      <div className="lg:hidden">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Clock className="h-4 w-4 text-blue-500" />}
            iconColor="bg-blue-500/10"
            label="Today"
            value={`${todayHours}h ${todayMinutes}m`}
            subValue={todayProgress >= 100 ? "Goal reached!" : `${Math.round(8 - todayHours - todayMinutes/60)}h to go`}
            progress={todayHours + todayMinutes / 60}
            progressMax={8}
            progressColor="text-blue-500"
            badge={todayProgress >= 100 ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : undefined}
            highlight={todayProgress >= 100}
          />
          <StatCard
            icon={<Calendar className="h-4 w-4 text-violet-500" />}
            iconColor="bg-violet-500/10"
            label="This Week"
            value={`${weeklyHours}h`}
            subValue={hasOvertime ? `+${overtimeHours}h overtime` : `${Math.max(0, 40 - weeklyHours)}h remaining`}
            progress={weeklyHours}
            progressMax={40}
            progressColor={hasOvertime ? "text-amber-500" : "text-violet-500"}
          />
          <StatCard
            icon={<Target className="h-4 w-4 text-emerald-500" />}
            iconColor="bg-emerald-500/10"
            label="On-Site Days"
            value={`${daysWorked}/${requiredDays}`}
            subValue={isCompliant ? "Compliant" : `${requiredDays - daysWorked} more needed`}
            progress={daysWorked}
            progressMax={requiredDays}
            progressColor="text-emerald-500"
            badge={isCompliant ? <Sparkles className="h-4 w-4 text-emerald-500" /> : undefined}
            highlight={isCompliant}
          />
          <StatCard
            icon={<Flame className="h-4 w-4 text-orange-500" />}
            iconColor="bg-orange-500/10"
            label="Current Streak"
            value={`${currentStreak}`}
            subValue={currentStreak > 0 ? `day${currentStreak !== 1 ? "s" : ""} in a row` : "Start your streak!"}
            badge={currentStreak >= 5 ? <TrendingUp className="h-4 w-4 text-orange-500" /> : undefined}
            highlight={currentStreak >= 7}
          />
        </div>
      </div>

      {/* Desktop: Horizontal stat bar */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="hidden lg:block"
      >
        <div className="rounded-2xl border bg-card p-4">
          <div className="grid grid-cols-4 divide-x divide-border">
            <motion.div variants={staggerChild} className="px-4 first:pl-0 last:pr-0">
              <div className="flex items-center gap-4">
                <div className="text-blue-500">
                  <CircularProgress
                    value={todayHours + todayMinutes / 60}
                    max={8}
                    size={52}
                    strokeWidth={5}
                    color="text-blue-500"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold tabular-nums">{todayHours}h {todayMinutes}m</span>
                    {todayProgress >= 100 && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground">Today</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={staggerChild} className="px-4 first:pl-0 last:pr-0">
              <div className="flex items-center gap-4">
                <div className={hasOvertime ? "text-amber-500" : "text-violet-500"}>
                  <CircularProgress
                    value={weeklyHours}
                    max={40}
                    size={52}
                    strokeWidth={5}
                    color={hasOvertime ? "text-amber-500" : "text-violet-500"}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold tabular-nums">{weeklyHours}h</span>
                    {hasOvertime && (
                      <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        +{overtimeHours}h OT
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={staggerChild} className="px-4 first:pl-0 last:pr-0">
              <div className="flex items-center gap-4">
                <div className="text-emerald-500">
                  <CircularProgress
                    value={daysWorked}
                    max={requiredDays}
                    size={52}
                    strokeWidth={5}
                    color="text-emerald-500"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold tabular-nums">{daysWorked}/{requiredDays}</span>
                    {isCompliant && <Sparkles className="h-4 w-4 text-emerald-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground">On-Site Days</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={staggerChild} className="px-4 first:pl-0 last:pr-0">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-[52px] h-[52px] rounded-full flex items-center justify-center",
                  currentStreak >= 7 ? "bg-orange-500/20" : "bg-orange-500/10"
                )}>
                  <Flame className={cn(
                    "h-6 w-6",
                    currentStreak >= 7 ? "text-orange-500" : "text-orange-400"
                  )} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold tabular-nums">{currentStreak}</span>
                    {currentStreak >= 5 && <TrendingUp className="h-4 w-4 text-orange-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </>
  )
}
