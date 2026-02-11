"use client"

import { motion } from "framer-motion"
import { StatWidget } from "@/components/dashboard/widget-grid"
import { staggerContainer, staggerChild } from "@/lib/animations"
import { Clock, Calendar, Target, Zap, CheckCircle2, Sparkles } from "lucide-react"

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
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
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
  )
}
