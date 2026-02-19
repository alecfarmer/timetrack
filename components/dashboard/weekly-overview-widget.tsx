"use client"

import { motion } from "framer-motion"
import { Widget } from "@/components/dashboard/widget-grid"
import { Calendar, CheckCircle2, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { OrgLink } from "@/components/org-link"
import { format } from "date-fns"

function MobileWeekStrip({ weekSummary }: { weekSummary: any }) {
  const today = format(new Date(), "yyyy-MM-dd")

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card border overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-semibold">This Week</span>
        </div>
        <OrgLink href="/history" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          View all
        </OrgLink>
      </div>

      <div className="flex px-2 pb-4 pt-1">
        {weekSummary?.weekDays?.map((day: any, i: number) => {
          const hours = Math.floor((day.minutes || 0) / 60)
          const mins = (day.minutes || 0) % 60
          const isToday = day.date === today
          const isWeekend = i === 0 || i === 6
          const isWfh = day.locationCategory === "HOME" && day.minutes > 0
          const isOnSite = day.worked // 'worked' means on-site (non-HOME) with meetsPolicy

          return (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                "flex-1 flex flex-col items-center gap-1.5 py-2 rounded-xl mx-0.5 transition-colors",
                isToday && "bg-primary/10",
                isWeekend && !isToday && "opacity-50"
              )}
            >
              <span className={cn(
                "text-[10px] uppercase font-semibold tracking-wider",
                isToday ? "text-primary" : "text-muted-foreground"
              )}>
                {day.dayOfWeek.slice(0, 1)}
              </span>

              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center",
                isOnSite
                  ? "bg-emerald-500 text-white"
                  : isWfh
                    ? "bg-blue-500 text-white"
                    : isToday
                      ? "ring-2 ring-primary text-foreground"
                      : "bg-muted/60 text-muted-foreground"
              )}>
                {isOnSite ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isWfh ? (
                  <Home className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">{new Date(day.date).getDate()}</span>
                )}
              </div>

              <span className={cn(
                "text-[10px] tabular-nums font-medium",
                day.minutes > 0 ? "text-foreground" : "text-muted-foreground/40"
              )}>
                {day.minutes > 0 ? `${hours}h${mins > 0 ? mins : ""}` : "-"}
              </span>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

export function WeeklyOverviewWidget({ weekSummary }: { weekSummary: any }) {
  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden">
        <MobileWeekStrip weekSummary={weekSummary} />
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <Widget
          title="Weekly Overview"
          icon={<Calendar className="h-4 w-4 text-violet-500" />}
          action={{ label: "View History", href: "/history" }}
        >
          {/* Legend */}
          <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>On-site</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>WFH</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekSummary?.weekDays?.map((day: any, i: number) => {
              const hours = Math.floor((day.minutes || 0) / 60)
              const mins = (day.minutes || 0) % 60
              const isToday = day.date === format(new Date(), "yyyy-MM-dd")
              const isWeekend = i === 0 || i === 6
              const isWfh = day.locationCategory === "HOME" && day.minutes > 0
              const isOnSite = day.worked // 'worked' means on-site (non-HOME) with meetsPolicy

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
                    isOnSite
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : isWfh
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "text-muted-foreground"
                  )}>
                    {isOnSite ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isWfh ? (
                      <Home className="h-4 w-4" />
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
      </div>
    </>
  )
}
