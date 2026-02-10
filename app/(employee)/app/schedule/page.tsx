"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NotificationCenter } from "@/components/notification-center"
import { RefreshButton } from "@/components/pull-to-refresh"
import { Calendar, Clock, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { format, startOfWeek, addWeeks, isToday } from "date-fns"
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
  const [refreshing, setRefreshing] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )

  useEffect(() => {
    const newWeekStart = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset)
    setCurrentWeekStart(newWeekStart)
  }, [weekOffset])

  const fetchSchedule = async () => {
    try {
      const res = await fetch(`/api/shifts/my-schedule?weeks=${Math.max(2, weekOffset + 2)}`)
      if (res.ok) {
        const data: ScheduleData = await res.json()
        setSchedule(data.schedule)
      }
    } catch (error) {
      console.error("Failed to fetch schedule:", error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchSchedule()
      setLoading(false)
    }
    loadData()
  }, [weekOffset])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchSchedule()
    setRefreshing(false)
  }

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
  const totalShiftsThisWeek = weekDays.reduce((count, day) => {
    const dateStr = format(day, "yyyy-MM-dd")
    return count + (shiftsByDate[dateStr]?.length || 0)
  }, 0)

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
              <CalendarDays className="h-8 w-8 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Loading schedule...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Premium Dark Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-pink-500/10 via-transparent to-transparent" />
        <div className="absolute inset-0 backdrop-blur-3xl" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />

        <header className="relative z-10 safe-area-pt">
          <div className="flex items-center justify-between px-4 h-14 max-w-6xl mx-auto lg:px-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-white">My Schedule</h1>
            </div>
            <div className="flex items-center gap-2">
              <RefreshButton onRefresh={handleRefresh} refreshing={refreshing} className="text-white/70 hover:text-white hover:bg-white/10" />
              <NotificationCenter />
            </div>
          </div>
        </header>

        {/* Week Navigation */}
        <div className="relative z-10 px-4 pt-4 pb-6 max-w-6xl mx-auto lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="gap-1 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-center">
              <p className="font-semibold text-white">
                {format(currentWeekStart, "MMM d")} - {format(weekDays[6], "MMM d, yyyy")}
              </p>
              {weekOffset === 0 && (
                <Badge className="bg-white/20 text-white border-0 text-xs mt-1">This Week</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="gap-1 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Week Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <p className="text-2xl font-bold text-white">{totalShiftsThisWeek}</p>
              <p className="text-xs text-white/60">Shifts This Week</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <p className="text-2xl font-bold text-white">{schedule.length}</p>
              <p className="text-xs text-white/60">Total Scheduled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 lg:pb-8 -mt-4">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          {!hasShifts ? (
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {weekDays.map((day, index) => {
                const dateStr = format(day, "yyyy-MM-dd")
                const dayShifts = shiftsByDate[dateStr] || []
                const today = isToday(day)

                return (
                  <motion.div
                    key={dateStr}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={cn(
                      "border-0 shadow-lg rounded-2xl transition-all",
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
                                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
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
        </div>
      </main>
    </motion.div>
  )
}
