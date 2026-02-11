"use client"

import { motion } from "framer-motion"
import { StatWidget } from "@/components/dashboard/widget-grid"
import { staggerContainer, staggerChild } from "@/lib/animations"
import { Clock, Calendar, Target, Zap, CheckCircle2, Sparkles } from "lucide-react"
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
  entryCount: number
}

function MobileStat({
  icon,
  iconBg,
  label,
  value,
  accent,
  progress,
  badge,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
  accent: string
  progress?: number
  badge?: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 py-3"
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tabular-nums">{value}</span>
          {badge}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          {progress !== undefined && (
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden max-w-[80px]">
              <motion.div
                className={cn("h-full rounded-full", accent)}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, progress)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          )}
        </div>
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
  entryCount,
}: StatsGridProps) {
  return (
    <>
      {/* Mobile: Compact inline stats */}
      <div className="lg:hidden">
        <div className="rounded-2xl bg-card border p-4 space-y-1">
          <div className="grid grid-cols-2 gap-x-4">
            <MobileStat
              icon={<Clock className="h-4 w-4 text-blue-500" />}
              iconBg="bg-blue-500/10"
              label="Today"
              value={`${todayHours}h ${todayMinutes}m`}
              accent="bg-blue-500"
              progress={todayProgress}
              badge={todayProgress >= 100 ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : undefined}
            />
            <MobileStat
              icon={<Calendar className="h-4 w-4 text-violet-500" />}
              iconBg="bg-violet-500/10"
              label="This Week"
              value={`${weeklyHours}h`}
              accent="bg-violet-500"
              progress={Math.min(100, (weeklyHours / 40) * 100)}
            />
            <MobileStat
              icon={<Target className="h-4 w-4 text-emerald-500" />}
              iconBg="bg-emerald-500/10"
              label="Days On-Site"
              value={`${daysWorked}/${requiredDays}`}
              accent="bg-emerald-500"
              progress={compliancePercent}
              badge={isCompliant ? <Sparkles className="h-3.5 w-3.5 text-emerald-500" /> : undefined}
            />
            <MobileStat
              icon={<Zap className="h-4 w-4 text-amber-500" />}
              iconBg="bg-amber-500/10"
              label="Entries Today"
              value={entryCount.toString()}
              accent="bg-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Desktop: Original card grid */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="hidden lg:grid grid-cols-4 gap-3"
      >
        <motion.div variants={staggerChild}>
          <StatWidget
            icon={<Clock className="h-4 w-4 text-blue-500" />}
            iconColor="bg-blue-500/10"
            label="Today"
            value={`${todayHours}h ${todayMinutes}m`}
            progress={todayProgress}
            progressColor="bg-blue-500"
            indicator={todayProgress >= 100 ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : undefined}
          />
        </motion.div>
        <motion.div variants={staggerChild}>
          <StatWidget
            icon={<Calendar className="h-4 w-4 text-violet-500" />}
            iconColor="bg-violet-500/10"
            label="This Week"
            value={`${weeklyHours}h`}
            progress={Math.min(100, (weeklyHours / 40) * 100)}
            progressColor="bg-violet-500"
          />
        </motion.div>
        <motion.div variants={staggerChild}>
          <StatWidget
            icon={<Target className="h-4 w-4 text-emerald-500" />}
            iconColor="bg-emerald-500/10"
            label="Days On-Site"
            value={`${daysWorked}/${requiredDays}`}
            progress={compliancePercent}
            progressColor="bg-emerald-500"
            indicator={isCompliant ? <Sparkles className="h-4 w-4 text-emerald-500" /> : undefined}
          />
        </motion.div>
        <motion.div variants={staggerChild}>
          <StatWidget
            icon={<Zap className="h-4 w-4 text-amber-500" />}
            iconColor="bg-amber-500/10"
            label="Entries Today"
            value={entryCount.toString()}
          />
        </motion.div>
      </motion.section>
    </>
  )
}
