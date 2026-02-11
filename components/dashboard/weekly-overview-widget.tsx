"use client"

import { motion } from "framer-motion"
import { Widget } from "@/components/dashboard/widget-grid"
import { Calendar, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export function WeeklyOverviewWidget({ weekSummary }: { weekSummary: any }) {
  return (
    <Widget
      title="Weekly Overview"
      icon={<Calendar className="h-4 w-4 text-violet-500" />}
      action={{ label: "View History", href: "/history" }}
    >
      <div className="grid grid-cols-7 gap-2">
        {weekSummary?.weekDays?.map((day: any, i: number) => {
          const hours = Math.floor((day.minutes || 0) / 60)
          const mins = (day.minutes || 0) % 60
          const isToday = day.date === format(new Date(), "yyyy-MM-dd")
          const isWeekend = i === 0 || i === 6
          return (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "flex flex-col items-center py-3 rounded-lg transition-colors",
                isToday && "bg-primary/10 ring-1 ring-primary/20",
                !isToday && "hover:bg-muted/50",
                isWeekend && "opacity-60"
              )}
            >
              <span className={cn(
                "text-[10px] uppercase tracking-wider mb-2",
                isToday ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                {day.dayOfWeek.slice(0, 3)}
              </span>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2",
                day.worked
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground"
              )}>
                {day.worked ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span className="text-xs">{new Date(day.date).getDate()}</span>
                )}
              </div>
              <span className={cn(
                "text-xs tabular-nums",
                day.minutes > 0 ? "text-foreground" : "text-muted-foreground/50"
              )}>
                {day.minutes > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ""}` : "-"}
              </span>
            </motion.div>
          )
        })}
      </div>
    </Widget>
  )
}
