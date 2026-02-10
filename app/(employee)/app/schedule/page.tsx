"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { format, parseISO, startOfWeek, addWeeks, isSameDay, isToday } from "date-fns"
import { cn } from "@/lib/utils"

interface ScheduledShift {
  date: string
  dayOfWeek: string
  shiftId: string
  shiftName: string
  startTime: string
  endTime: string
  color: string
}

interface ScheduleData {
  schedule: ScheduledShift[]
  weekStart: string
  weekEnd: string
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":")
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<ScheduledShift[]>([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )

  useEffect(() => {
    const newWeekStart = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset)
    setCurrentWeekStart(newWeekStart)
  }, [weekOffset])

  useEffect(() => {
    async function fetchSchedule() {
      setLoading(true)
      try {
        const res = await fetch(`/api/shifts/my-schedule?weeks=${Math.max(2, weekOffset + 2)}`)
        if (res.ok) {
          const data: ScheduleData = await res.json()
          setSchedule(data.schedule)
        }
      } catch (error) {
        console.error("Failed to fetch schedule:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSchedule()
  }, [weekOffset])

  // Group shifts by date
  const shiftsByDate = schedule.reduce((acc, shift) => {
    if (!acc[shift.date]) {
      acc[shift.date] = []
    }
    acc[shift.date].push(shift)
    return acc
  }, {} as Record<string, ScheduledShift[]>)

  // Generate days for current week view
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart)
    date.setDate(date.getDate() + i)
    return date
  })

  const hasShifts = schedule.length > 0

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b safe-area-pt">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">My Schedule</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4 pb-24 lg:pb-8">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(prev => prev - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="text-center">
            <p className="font-semibold">
              {format(currentWeekStart, "MMM d")} - {format(weekDays[6], "MMM d, yyyy")}
            </p>
            {weekOffset === 0 && (
              <Badge variant="secondary" className="text-xs mt-1">This Week</Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(prev => prev + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !hasShifts ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Shifts Scheduled</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              You don't have any shifts assigned yet. Check with your manager if you're expecting to be scheduled.
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {weekDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd")
              const dayShifts = shiftsByDate[dateStr] || []
              const today = isToday(day)

              return (
                <motion.div key={dateStr} variants={staggerItem}>
                  <Card className={cn(
                    "transition-all",
                    today && "ring-2 ring-primary ring-offset-2"
                  )}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-sm font-semibold",
                            today && "text-primary"
                          )}>
                            {format(day, "EEEE")}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(day, "MMM d")}
                          </span>
                        </div>
                        {today && (
                          <Badge variant="default" className="text-xs">Today</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {dayShifts.length > 0 ? (
                        <div className="space-y-2">
                          {dayShifts.map((shift, idx) => (
                            <div
                              key={`${shift.shiftId}-${idx}`}
                              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                              style={{ borderLeft: `4px solid ${shift.color}` }}
                            >
                              <div className="flex-1">
                                <p className="font-medium">{shift.shiftName}</p>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground py-2">No shifts scheduled</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </main>
    </div>
  )
}
