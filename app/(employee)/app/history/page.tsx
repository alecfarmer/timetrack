"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from "date-fns"
import { formatTime, formatDateInZone, formatDuration } from "@/lib/dates"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Clock,
  Building2,
  Home,
  TrendingUp,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TimesheetSubmit } from "@/components/timesheet-submit"

interface Entry {
  id: string
  type: "CLOCK_IN" | "CLOCK_OUT"
  timestampServer: string
  location: {
    name: string
    code: string | null
    category: string
  }
}

interface DayData {
  date: Date
  entries: Entry[]
  hasWork: boolean
  isOnsite: boolean
  isWfh: boolean
  totalMinutes: number
  locations: string[]
}

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

function calculateDayMinutes(entries: Entry[]): number {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestampServer).getTime() - new Date(b.timestampServer).getTime()
  )

  let total = 0
  let clockInTime: Date | null = null

  for (const entry of sorted) {
    if (entry.type === "CLOCK_IN") {
      clockInTime = new Date(entry.timestampServer)
    } else if (entry.type === "CLOCK_OUT" && clockInTime) {
      total += Math.floor((new Date(entry.timestampServer).getTime() - clockInTime.getTime()) / 60000)
      clockInTime = null
    }
  }

  return total
}

export default function HistoryPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [monthData, setMonthData] = useState<DayData[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMonthData()
  }, [currentMonth])

  const fetchMonthData = async () => {
    setLoading(true)
    try {
      const start = startOfMonth(currentMonth)
      const end = endOfMonth(currentMonth)
      const days = eachDayOfInterval({ start, end })

      const res = await fetch(
        `/api/entries?startDate=${start.toISOString()}&endDate=${end.toISOString()}&limit=500`
      )
      const data = await res.json()
      const entries: Entry[] = data.entries || []

      const dayDataMap = new Map<string, Entry[]>()
      entries.forEach((entry) => {
        const dateKey = formatDateInZone(entry.timestampServer, "yyyy-MM-dd")
        if (!dayDataMap.has(dateKey)) {
          dayDataMap.set(dateKey, [])
        }
        dayDataMap.get(dateKey)!.push(entry)
      })

      const monthData: DayData[] = days.map((date) => {
        const dateKey = format(date, "yyyy-MM-dd")
        const dayEntries = dayDataMap.get(dateKey) || []
        const hasClockIn = dayEntries.some((e) => e.type === "CLOCK_IN")
        const categories = [...new Set(dayEntries.filter(e => e.type === "CLOCK_IN").map(e => e.location.category))]
        const locationCodes = [...new Set(dayEntries.filter(e => e.type === "CLOCK_IN").map(e => e.location.code || e.location.name))]
        const hasOnsiteWork = categories.some(c => c !== "HOME")
        const hasWfhWork = categories.includes("HOME")

        return {
          date,
          entries: dayEntries,
          hasWork: hasClockIn,
          isOnsite: hasOnsiteWork,
          isWfh: hasWfhWork && !hasOnsiteWork,
          totalMinutes: calculateDayMinutes(dayEntries),
          locations: locationCodes,
        }
      })

      setMonthData(monthData)
    } catch (error) {
      console.error("Failed to fetch month data:", error)
    }
    setLoading(false)
  }

  const previousMonth = () => setCurrentMonth((prev) => subMonths(prev, 1))
  const nextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1))

  const selectedDayData = selectedDate
    ? monthData.find((d) => format(d.date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd"))
    : null

  const stats = useMemo(() => {
    const daysOnsite = monthData.filter((d) => d.isOnsite).length
    const daysWfh = monthData.filter((d) => d.isWfh).length
    const totalDays = monthData.filter((d) => d.hasWork).length
    const totalMinutes = monthData.reduce((sum, d) => sum + d.totalMinutes, 0)
    const totalHours = Math.floor(totalMinutes / 60)
    const remainingMins = totalMinutes % 60
    return { daysOnsite, daysWfh, totalDays, totalMinutes, totalHours, remainingMins }
  }, [monthData])

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
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Loading history...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-background"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold">History</h1>
          </div>
          <h1 className="hidden lg:block text-xl font-semibold">History</h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24 lg:pb-8">
        <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8">
          {/* Month Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-primary">{stats.daysOnsite}</p>
                <p className="text-xs text-muted-foreground">On-Site</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                  <Home className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-blue-500">{stats.daysWfh}</p>
                <p className="text-xs text-muted-foreground">WFH</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-amber-500">
                  {stats.totalHours}<span className="text-base font-medium">h</span>
                </p>
                <p className="text-xs text-muted-foreground">Total Hours</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-xl">
                <CardContent className="p-5">
                  {/* Month navigation */}
                  <div className="flex items-center justify-between mb-5">
                    <Button variant="ghost" size="icon" onClick={previousMonth} className="rounded-xl h-9 w-9">
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl h-9 w-9">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                      <div key={i} className="text-center text-xs font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {monthData.map((dayData, index) => {
                      const dayOfWeek = dayData.date.getDay()
                      const isSelected =
                        selectedDate &&
                        format(selectedDate, "yyyy-MM-dd") === format(dayData.date, "yyyy-MM-dd")
                      const today = new Date()
                      const isTodayDate =
                        dayData.date.getDate() === today.getDate() &&
                        dayData.date.getMonth() === today.getMonth() &&
                        dayData.date.getFullYear() === today.getFullYear()

                      return (
                        <motion.button
                          key={dayData.date.toISOString()}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => setSelectedDate(dayData.date)}
                          className={cn(
                            "aspect-square rounded-xl flex flex-col items-center justify-center text-sm relative transition-all",
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                              : dayData.isOnsite
                              ? "bg-success/15 hover:bg-success/25 text-success-foreground"
                              : dayData.isWfh
                              ? "bg-blue-500/10 hover:bg-blue-500/20"
                              : "hover:bg-muted/60",
                            isTodayDate && !isSelected && "ring-2 ring-primary/50 ring-offset-1 ring-offset-background"
                          )}
                          style={index === 0 ? { gridColumnStart: dayOfWeek + 1 } : undefined}
                        >
                          <span className={cn("font-medium text-[13px]", isSelected && "text-primary-foreground")}>
                            {format(dayData.date, "d")}
                          </span>
                          {dayData.hasWork && !isSelected && (
                            <div
                              className={cn(
                                "absolute bottom-1 w-1 h-1 rounded-full",
                                dayData.isOnsite ? "bg-success" : "bg-blue-500"
                              )}
                            />
                          )}
                          {dayData.hasWork && isSelected && (
                            <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary-foreground/70" />
                          )}
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-5 mt-4 pt-3 border-t">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-success" />
                      <span className="text-xs text-muted-foreground">On-Site</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="text-xs text-muted-foreground">WFH</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full ring-2 ring-primary/50 ring-offset-1 ring-offset-background" />
                      <span className="text-xs text-muted-foreground">Today</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Selected Day Details */}
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {selectedDate && selectedDayData ? (
                  <motion.div
                    key={format(selectedDate, "yyyy-MM-dd")}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="border-0 shadow-xl">
                      <CardContent className="p-5">
                        {/* Day header */}
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {format(selectedDate, "EEEE")}
                            </p>
                            <p className="text-lg font-semibold">
                              {format(selectedDate, "MMM d, yyyy")}
                            </p>
                          </div>
                          {selectedDayData.hasWork && (
                            <Badge
                              variant={selectedDayData.isOnsite ? "success" : "secondary"}
                              className="text-xs"
                            >
                              {selectedDayData.isOnsite ? (
                                <><Building2 className="h-3 w-3 mr-1" />On-Site</>
                              ) : (
                                <><Home className="h-3 w-3 mr-1" />WFH</>
                              )}
                            </Badge>
                          )}
                        </div>

                        {selectedDayData.entries.length > 0 ? (
                          <>
                            {/* Day summary */}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 mb-4">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {formatDuration(selectedDayData.totalMinutes)}
                                </p>
                                <p className="text-xs text-muted-foreground">Total time worked</p>
                              </div>
                              {selectedDayData.locations.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {selectedDayData.locations.join(", ")}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Timeline */}
                            <div className="space-y-0">
                              {selectedDayData.entries
                                .sort(
                                  (a, b) =>
                                    new Date(a.timestampServer).getTime() -
                                    new Date(b.timestampServer).getTime()
                                )
                                .map((entry, i, arr) => {
                                  const isClockIn = entry.type === "CLOCK_IN"
                                  const isLast = i === arr.length - 1

                                  return (
                                    <div key={entry.id} className="flex gap-3">
                                      {/* Timeline line */}
                                      <div className="flex flex-col items-center">
                                        <div
                                          className={cn(
                                            "w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0",
                                            isClockIn ? "bg-success" : "bg-destructive"
                                          )}
                                        />
                                        {!isLast && (
                                          <div className="w-px flex-1 bg-border min-h-[24px]" />
                                        )}
                                      </div>
                                      {/* Content */}
                                      <div className={cn("pb-3", isLast && "pb-0")}>
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-sm font-medium">
                                            {formatTime(entry.timestampServer)}
                                          </span>
                                          <Badge
                                            variant={isClockIn ? "success" : "destructive"}
                                            className="text-[10px] px-1.5 py-0"
                                          >
                                            {isClockIn ? "IN" : "OUT"}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                          {entry.location.code || entry.location.name}
                                          {entry.location.category === "HOME" && " (WFH)"}
                                        </p>
                                      </div>
                                    </div>
                                  )
                                })}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                              <Calendar className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                            <p className="text-sm text-muted-foreground">No entries this day</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Card className="border-0 shadow-lg border-dashed">
                      <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                          <ArrowRight className="h-5 w-5 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Select a day to view details
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Monthly breakdown by location */}
              {stats.totalDays > 0 && (
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold mb-3">Month Summary</h3>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Days</span>
                        <span className="font-medium">{stats.totalDays}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">On-Site Days</span>
                        <span className="font-medium text-success">{stats.daysOnsite}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">WFH Days</span>
                        <span className="font-medium text-blue-500">{stats.daysWfh}</span>
                      </div>
                      <div className="h-px bg-border my-1" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Hours</span>
                        <span className="font-medium">
                          {stats.totalHours}h {stats.remainingMins}m
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timesheet Submission */}
              <TimesheetSubmit />
            </div>
          </div>
        </div>
      </main>

    </motion.div>
  )
}
