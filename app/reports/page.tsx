"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  BarChart3,
  Download,
  Clock,
  Calendar,
  CheckCircle,
  TrendingUp,
  Building2,
  Home,
  MapPin,
  AlertTriangle,
  Target,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BottomNav } from "@/components/bottom-nav"

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

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function ReportsPage() {
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null)
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const [weekRes, monthRes] = await Promise.all([
        fetch("/api/workdays/week"),
        fetch("/api/reports/monthly"),
      ])

      if (weekRes.ok) {
        const weekData = await weekRes.json()
        setWeekSummary(weekData)
      }

      if (monthRes.ok) {
        const monthData = await monthRes.json()
        setMonthSummary(monthData)
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error)
    }
    setLoading(false)
  }

  const formatHM = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}h ${m}m`
  }

  const handleExportCSV = () => {
    alert("CSV export coming soon!")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/20 animate-ping absolute inset-0" />
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Loading reports...</p>
        </motion.div>
      </div>
    )
  }

  const weeklyHoursPercent = weekSummary
    ? Math.min(100, (weekSummary.totalMinutes / weekSummary.requiredMinutesPerWeek) * 100)
    : 0
  const weeklyDaysPercent = weekSummary
    ? Math.min(100, (weekSummary.daysWorked / weekSummary.requiredDays) * 100)
    : 0

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-background"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b lg:ml-64">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold">Reports</h1>
          </div>
          <h1 className="hidden lg:block text-xl font-semibold">Reports</h1>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 rounded-xl">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <motion.main
        className="flex-1 pb-24 lg:pb-8 lg:ml-64"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8">
          <Tabs defaultValue="weekly" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md rounded-xl">
              <TabsTrigger value="weekly" className="rounded-lg">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" className="rounded-lg">Monthly</TabsTrigger>
            </TabsList>

            {/* ===================== WEEKLY TAB ===================== */}
            <TabsContent value="weekly" className="mt-6">
              {weekSummary && (
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

                          {/* Hours progress bar */}
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${weeklyHoursPercent}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className={cn(
                                "h-full rounded-full",
                                weekSummary.hoursOnTrack ? "bg-success" : "bg-primary"
                              )}
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

                          {/* Days progress bar */}
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${weeklyDaysPercent}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className={cn(
                                "h-full rounded-full",
                                weekSummary.isCompliant ? "bg-success" : "bg-warning"
                              )}
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

                  {/* Daily Breakdown Table */}
                  <motion.div variants={staggerItem}>
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Calendar className="h-4.5 w-4.5 text-primary" />
                          Daily Breakdown
                          {weekSummary.weekStart && (
                            <span className="text-sm font-normal text-muted-foreground ml-auto">
                              {format(new Date(weekSummary.weekStart), "MMM d")} – {format(new Date(weekSummary.weekEnd), "MMM d")}
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          {/* Header row */}
                          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            <div className="col-span-2">Day</div>
                            <div className="col-span-3">Location</div>
                            <div className="col-span-4">Hours</div>
                            <div className="col-span-3 text-right">Status</div>
                          </div>

                          {/* Day rows — Mon–Fri only */}
                          {weekSummary.weekDays
                            .filter((d) => d.dayNumber >= 1 && d.dayNumber <= 5)
                            .map((day) => {
                              const isToday = day.date === format(new Date(), "yyyy-MM-dd")
                              const hours = day.minutes / 60
                              const barPercent = Math.min(100, (day.minutes / 480) * 100) // 8h = full

                              return (
                                <div
                                  key={day.date}
                                  className={cn(
                                    "grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-lg transition-colors",
                                    isToday && "bg-primary/5 ring-1 ring-primary/20",
                                    !isToday && day.minutes > 0 && "bg-muted/30"
                                  )}
                                >
                                  {/* Day */}
                                  <div className="col-span-2 flex items-center gap-2">
                                    <span className={cn(
                                      "text-sm font-semibold",
                                      isToday && "text-primary"
                                    )}>
                                      {day.dayOfWeek}
                                    </span>
                                    {isToday && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    )}
                                  </div>

                                  {/* Location */}
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

                                  {/* Hours bar */}
                                  <div className="col-span-4 flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                      {day.minutes > 0 && (
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${barPercent}%` }}
                                          transition={{ duration: 0.6, ease: "easeOut" }}
                                          className={cn(
                                            "h-full rounded-full",
                                            day.minutes >= 480
                                              ? "bg-success"
                                              : day.minutes >= 360
                                              ? "bg-primary"
                                              : "bg-warning"
                                          )}
                                        />
                                      )}
                                    </div>
                                    <span className="text-xs tabular-nums text-muted-foreground min-w-[40px] text-right">
                                      {day.minutes > 0 ? formatHM(day.minutes) : "—"}
                                    </span>
                                  </div>

                                  {/* Status */}
                                  <div className="col-span-3 text-right">
                                    {day.minutes >= 480 ? (
                                      <Badge variant="default" className="bg-success/15 text-success text-[11px] border-0">
                                        8h+
                                      </Badge>
                                    ) : day.minutes > 0 ? (
                                      <Badge variant="secondary" className="text-[11px] border-0">
                                        {hours.toFixed(1)}h
                                      </Badge>
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
                                    className={cn(
                                      "h-full rounded-full",
                                      weekSummary.hoursOnTrack ? "bg-success" : "bg-primary"
                                    )}
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
                                className={cn(
                                  "text-xs",
                                  weekSummary.hoursOnTrack
                                    ? "bg-success text-success-foreground"
                                    : "bg-primary"
                                )}
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
              )}
            </TabsContent>

            {/* ===================== MONTHLY TAB ===================== */}
            <TabsContent value="monthly" className="mt-6">
              {monthSummary && (
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

                  {/* Weekly breakdown */}
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
                            {/* Header */}
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
                                    <span className="text-sm tabular-nums">
                                      {week.daysWorked}/{week.requiredDays}
                                    </span>
                                  </div>
                                  <div className="col-span-4 flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${weekHoursPercent}%` }}
                                        transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                                        className={cn(
                                          "h-full rounded-full",
                                          week.totalMinutes >= 2400 ? "bg-success" : "bg-primary"
                                        )}
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
                                      <Badge variant="secondary" className="text-[11px] border-0">
                                        In Progress
                                      </Badge>
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
                                      <div
                                        className="h-full rounded-full bg-primary"
                                        style={{ width: `${locPercent}%` }}
                                      />
                                    </div>
                                    <span className="text-[11px] text-muted-foreground tabular-nums">
                                      {locPercent}%
                                    </span>
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
              )}
            </TabsContent>
          </Tabs>
        </div>
      </motion.main>

      <BottomNav currentPath="/reports" />
    </motion.div>
  )
}
