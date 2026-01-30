"use client"

import { motion } from "framer-motion"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  Calendar,
  CheckCircle,
  Building2,
  Home,
  MapPin,
  AlertTriangle,
  Target,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface WeekDay {
  date: string
  dayOfWeek: string
  dayNumber: number
  worked: boolean
  minutes: number
  locationCode: string | null
  locationCategory: string | null
}

interface WeekSummary {
  weekStart: string
  weekEnd: string
  daysWorked: number
  requiredDays: number
  totalMinutes: number
  requiredMinutesPerWeek: number
  hoursOnTrack: boolean
  isCompliant: boolean
  weekDays: WeekDay[]
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

export function WeeklyReport({ weekSummary }: { weekSummary: WeekSummary }) {
  const weeklyHoursPercent = Math.min(100, (weekSummary.totalMinutes / weekSummary.requiredMinutesPerWeek) * 100)
  const weeklyDaysPercent = Math.min(100, (weekSummary.daysWorked / weekSummary.requiredDays) * 100)

  return (
    <div className="space-y-6">
      {/* Top Row: Hours + Days side by side */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Hours Tracker */}
        <motion.div variants={staggerItem}>
          <Card className={cn(
            "border-0 shadow-xl overflow-hidden",
            weekSummary.hoursOnTrack && "ring-2 ring-success/50"
          )}>
            <div className={cn("h-1.5", weekSummary.hoursOnTrack ? "bg-success" : "bg-primary")} />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Weekly Hours</p>
                    <p className="text-sm font-semibold">
                      {formatHM(weekSummary.totalMinutes)}{" "}
                      <span className="text-muted-foreground font-normal">/ 40h</span>
                    </p>
                  </div>
                </div>
                {weekSummary.hoursOnTrack ? (
                  <Badge variant="default" className="bg-success text-success-foreground gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Met
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Target className="h-3 w-3" />
                    {formatHM(weekSummary.requiredMinutesPerWeek - weekSummary.totalMinutes)} left
                  </Badge>
                )}
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${weeklyHoursPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={cn("h-full rounded-full", weekSummary.hoursOnTrack ? "bg-success" : "bg-primary")}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[11px] text-muted-foreground tabular-nums">
                <span>0h</span>
                <span>20h</span>
                <span>40h</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Days Compliance */}
        <motion.div variants={staggerItem}>
          <Card className={cn(
            "border-0 shadow-xl overflow-hidden",
            weekSummary.isCompliant && "ring-2 ring-success/50"
          )}>
            <div className={cn("h-1.5", weekSummary.isCompliant ? "bg-success" : "bg-warning")} />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">In-Office Days</p>
                    <p className="text-sm font-semibold">
                      {weekSummary.daysWorked}{" "}
                      <span className="text-muted-foreground font-normal">/ {weekSummary.requiredDays} required</span>
                    </p>
                  </div>
                </div>
                {weekSummary.isCompliant ? (
                  <Badge variant="default" className="bg-success text-success-foreground gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Compliant
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1 text-warning">
                    <AlertTriangle className="h-3 w-3" />
                    {weekSummary.requiredDays - weekSummary.daysWorked} more
                  </Badge>
                )}
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${weeklyDaysPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={cn("h-full rounded-full", weekSummary.isCompliant ? "bg-success" : "bg-warning")}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[11px] text-muted-foreground tabular-nums">
                <span>0</span>
                <span>{weekSummary.requiredDays} days</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Daily Hours Bar Chart */}
      <motion.div variants={staggerItem}>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4.5 w-4.5 text-primary" />
              Daily Hours
              {weekSummary.weekStart && (
                <span className="text-sm font-normal text-muted-foreground ml-auto">
                  {format(new Date(weekSummary.weekStart), "MMM d")} – {format(new Date(weekSummary.weekEnd), "MMM d")}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-48 mb-2">
              {weekSummary.weekDays
                .filter((d) => d.dayNumber >= 1 && d.dayNumber <= 5)
                .map((day) => {
                  const isToday = day.date === format(new Date(), "yyyy-MM-dd")
                  const hours = day.minutes / 60
                  const barHeight = Math.min(100, (day.minutes / 600) * 100)

                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-xs tabular-nums font-medium text-muted-foreground">
                        {day.minutes > 0 ? `${hours.toFixed(1)}h` : ""}
                      </span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${barHeight}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={cn(
                          "w-full rounded-t-lg min-h-[4px] relative",
                          day.minutes >= 480 ? "bg-success"
                            : day.minutes >= 360 ? "bg-primary"
                            : day.minutes > 0 ? "bg-warning"
                            : "bg-muted",
                          isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        )}
                      >
                        {day.minutes > 0 && day.minutes < 480 && (
                          <div
                            className="absolute left-0 right-0 border-t-2 border-dashed border-muted-foreground/30"
                            style={{ bottom: `${((480 - day.minutes) / (day.minutes || 1)) * 100}%` }}
                          />
                        )}
                      </motion.div>
                      <span className={cn("text-xs font-medium", isToday ? "text-primary" : "text-muted-foreground")}>
                        {day.dayOfWeek}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {day.locationCode ? (
                          day.locationCategory === "HOME" ? (
                            <Home className="h-3 w-3 text-blue-500" />
                          ) : (
                            <MapPin className="h-3 w-3 text-primary" />
                          )
                        ) : (
                          <span className="h-3 w-3" />
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-4 border-t-2 border-dashed border-muted-foreground/40" />
                8h target
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground ml-3">
                <MapPin className="h-3 w-3 text-primary" /> On-Site
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Home className="h-3 w-3 text-blue-500" /> WFH
              </div>
              <div className="ml-auto text-sm font-bold tabular-nums">
                {formatHM(weekSummary.totalMinutes)}
                <span className="text-muted-foreground font-normal text-xs"> / 40h</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Daily Breakdown Table */}
      <motion.div variants={staggerItem}>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4.5 w-4.5 text-primary" />
              Daily Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <div className="col-span-2">Day</div>
                <div className="col-span-3">Location</div>
                <div className="col-span-4">Hours</div>
                <div className="col-span-3 text-right">Status</div>
              </div>

              {weekSummary.weekDays
                .filter((d) => d.dayNumber >= 1 && d.dayNumber <= 5)
                .map((day) => {
                  const isToday = day.date === format(new Date(), "yyyy-MM-dd")
                  const hours = day.minutes / 60
                  const barPercent = Math.min(100, (day.minutes / 480) * 100)

                  return (
                    <div
                      key={day.date}
                      className={cn(
                        "grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-lg transition-colors",
                        isToday && "bg-primary/5 ring-1 ring-primary/20",
                        !isToday && day.minutes > 0 && "bg-muted/30"
                      )}
                    >
                      <div className="col-span-2 flex items-center gap-2">
                        <span className={cn("text-sm font-semibold", isToday && "text-primary")}>
                          {day.dayOfWeek}
                        </span>
                        {isToday && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </div>
                      <div className="col-span-3">
                        {day.locationCode ? (
                          <div className="flex items-center gap-1.5">
                            {day.locationCategory === "HOME" ? (
                              <Home className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className="text-sm">{day.locationCode}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground/50">—</span>
                        )}
                      </div>
                      <div className="col-span-4 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          {day.minutes > 0 && (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${barPercent}%` }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                              className={cn(
                                "h-full rounded-full",
                                day.minutes >= 480 ? "bg-success"
                                  : day.minutes >= 360 ? "bg-primary"
                                  : "bg-warning"
                              )}
                            />
                          )}
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground min-w-[40px] text-right">
                          {day.minutes > 0 ? formatHM(day.minutes) : "—"}
                        </span>
                      </div>
                      <div className="col-span-3 text-right">
                        {day.minutes >= 480 ? (
                          <Badge variant="default" className="bg-success/15 text-success text-[11px] border-0">8h+</Badge>
                        ) : day.minutes > 0 ? (
                          <Badge variant="secondary" className="text-[11px] border-0">{hours.toFixed(1)}h</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">No data</span>
                        )}
                      </div>
                    </div>
                  )
                })}

              {/* Totals row */}
              <div className="grid grid-cols-12 gap-2 items-center px-3 py-3 mt-2 border-t">
                <div className="col-span-2">
                  <span className="text-sm font-bold">Total</span>
                </div>
                <div className="col-span-3" />
                <div className="col-span-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${weeklyHoursPercent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={cn("h-full rounded-full", weekSummary.hoursOnTrack ? "bg-success" : "bg-primary")}
                      />
                    </div>
                    <span className="text-sm font-bold tabular-nums min-w-[52px] text-right">
                      {formatHM(weekSummary.totalMinutes)}
                    </span>
                  </div>
                </div>
                <div className="col-span-3 text-right">
                  <Badge
                    variant="default"
                    className={cn("text-xs", weekSummary.hoursOnTrack ? "bg-success text-success-foreground" : "bg-primary")}
                  >
                    {weekSummary.hoursOnTrack ? "40h Met" : `${formatHM(weekSummary.requiredMinutesPerWeek - weekSummary.totalMinutes)} to go`}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
