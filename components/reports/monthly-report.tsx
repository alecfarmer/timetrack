"use client"

import { motion } from "framer-motion"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  TrendingUp,
  Building2,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MonthSummary {
  weeksCompliant: number
  totalWeeks: number
  totalDaysWorked: number
  totalMinutes: number
  weeklyBreakdown?: {
    weekStart: string
    weekEnd: string
    daysWorked: number
    requiredDays: number
    isCompliant: boolean
    totalMinutes: number
  }[]
  byLocation?: Record<string, { days: number; minutes: number }>
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

function formatHM(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

export function MonthlyReport({ monthSummary }: { monthSummary: MonthSummary }) {
  return (
    <div className="space-y-6">
      {/* Top stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-5 text-center">
              <p className="text-3xl font-bold">{monthSummary.weeksCompliant}</p>
              <p className="text-xs text-muted-foreground mt-1">
                of {monthSummary.totalWeeks} weeks compliant
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-5 text-center">
              <p className="text-3xl font-bold">{monthSummary.totalDaysWorked}</p>
              <p className="text-xs text-muted-foreground mt-1">days on-site</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-5 text-center">
              <p className="text-3xl font-bold tabular-nums">{formatHM(monthSummary.totalMinutes)}</p>
              <p className="text-xs text-muted-foreground mt-1">total hours</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-5 text-center">
              <p className="text-3xl font-bold tabular-nums">
                {monthSummary.totalDaysWorked > 0
                  ? formatHM(Math.round(monthSummary.totalMinutes / monthSummary.totalDaysWorked))
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">avg per day</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Monthly Hours Chart */}
      {monthSummary.weeklyBreakdown && monthSummary.weeklyBreakdown.length > 0 && (
        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4.5 w-4.5 text-primary" />
                Weekly Hours — {format(new Date(), "MMMM yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 h-40 mb-2">
                {monthSummary.weeklyBreakdown.map((week, i) => {
                  const hours = week.totalMinutes / 60
                  const barHeight = Math.min(100, (week.totalMinutes / 2400) * 100)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-xs tabular-nums font-medium text-muted-foreground">
                        {hours.toFixed(1)}h
                      </span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${barHeight}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                        className={cn(
                          "w-full rounded-t-lg min-h-[4px]",
                          week.isCompliant ? "bg-success" : "bg-primary"
                        )}
                      />
                      <span className="text-[10px] text-muted-foreground text-center">Wk {i + 1}</span>
                      <span className="text-[10px] text-muted-foreground">{week.daysWorked}/{week.requiredDays}d</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-3 mt-2 pt-2 border-t text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-success" /> 40h met
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-primary" /> Under 40h
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Weekly breakdown table */}
      {monthSummary.weeklyBreakdown && monthSummary.weeklyBreakdown.length > 0 && (
        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4.5 w-4.5 text-primary" />
                Weekly Summary — {format(new Date(), "MMMM yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <div className="col-span-3">Week</div>
                  <div className="col-span-2">Days</div>
                  <div className="col-span-4">Hours</div>
                  <div className="col-span-3 text-right">Status</div>
                </div>

                {monthSummary.weeklyBreakdown.map((week, i) => {
                  const weekHoursPercent = Math.min(100, (week.totalMinutes / 2400) * 100)
                  return (
                    <div
                      key={i}
                      className={cn(
                        "grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-lg",
                        week.isCompliant && "bg-success/5"
                      )}
                    >
                      <div className="col-span-3">
                        <span className="text-sm font-medium">
                          {format(new Date(week.weekStart), "MMM d")}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm tabular-nums">{week.daysWorked}/{week.requiredDays}</span>
                      </div>
                      <div className="col-span-4 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${weekHoursPercent}%` }}
                            transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                            className={cn("h-full rounded-full", week.totalMinutes >= 2400 ? "bg-success" : "bg-primary")}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground min-w-[40px] text-right">
                          {formatHM(week.totalMinutes)}
                        </span>
                      </div>
                      <div className="col-span-3 text-right">
                        {week.isCompliant ? (
                          <Badge variant="default" className="bg-success/15 text-success text-[11px] border-0 gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Compliant
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[11px] border-0">In Progress</Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Location Breakdown */}
      {monthSummary.byLocation && Object.keys(monthSummary.byLocation).length > 0 && (
        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4.5 w-4.5 text-primary" />
                Time by Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(monthSummary.byLocation).map(([code, data]) => {
                  const locPercent = monthSummary.totalMinutes > 0
                    ? Math.round((data.minutes / monthSummary.totalMinutes) * 100)
                    : 0
                  return (
                    <div key={code} className="bg-muted/40 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="font-semibold">{code}</Badge>
                        <span className="text-xs text-muted-foreground">{data.days} days</span>
                      </div>
                      <p className="text-xl font-bold tabular-nums">{formatHM(data.minutes)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${locPercent}%` }} />
                        </div>
                        <span className="text-[11px] text-muted-foreground tabular-nums">{locPercent}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
