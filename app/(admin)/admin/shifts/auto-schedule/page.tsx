"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  Loader2,
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Users,
  Send,
} from "lucide-react"
import { format, startOfWeek, addWeeks } from "date-fns"
// import { cn } from "@/lib/utils"

interface ScheduleEntry {
  shiftId: string
  shiftName: string
  userId: string
  userName: string
  date: string
  dayOfWeek: number
  startTime: string
  endTime: string
  color: string
  score: number
  reason: string
}

interface UnfilledSlot {
  shiftId: string
  shiftName: string
  date: string
  dayOfWeek: number
  reason: string
}

interface ScheduleResult {
  weekStart: string
  entries: ScheduleEntry[]
  unfilledSlots: UnfilledSlot[]
  stats: {
    totalSlots: number
    filledSlots: number
    unfilledSlots: number
    memberAssignments: Record<string, number>
  }
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function AutoSchedulePage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [weekOffset, setWeekOffset] = useState(1) // Start with next week
  const [schedule, setSchedule] = useState<ScheduleResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)

  const weekStart = format(
    startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  )

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push("/")
  }, [authLoading, isAdmin, router])

  const generateSchedule = useCallback(async () => {
    setLoading(true)
    setPublished(false)
    setSchedule(null)
    try {
      const res = await fetch(`/api/admin/shifts/auto-schedule?weekStart=${weekStart}`)
      if (res.ok) {
        const data = await res.json()
        setSchedule(data)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  const publishSchedule = async () => {
    if (!schedule || schedule.entries.length === 0) return
    setPublishing(true)
    try {
      const res = await fetch("/api/admin/shifts/auto-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignments: schedule.entries.map((e) => ({
            shiftId: e.shiftId,
            userId: e.userId,
            effectiveDate: e.date,
          })),
        }),
      })
      if (res.ok) {
        setPublished(true)
      }
    } catch {
      // silent
    } finally {
      setPublishing(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Group entries by date for display
  const entriesByDate: Record<string, ScheduleEntry[]> = {}
  const unfilledByDate: Record<string, UnfilledSlot[]> = {}
  if (schedule) {
    for (const e of schedule.entries) {
      if (!entriesByDate[e.date]) entriesByDate[e.date] = []
      entriesByDate[e.date].push(e)
    }
    for (const u of schedule.unfilledSlots) {
      if (!unfilledByDate[u.date]) unfilledByDate[u.date] = []
      unfilledByDate[u.date].push(u)
    }
  }

  // Generate all dates for the week
  const weekDates: string[] = []
  for (let i = 0; i < 7; i++) {
    weekDates.push(format(addWeeks(startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }), 0).getTime() + i * 86400000, "yyyy-MM-dd"))
  }

  return (
    <div className="flex flex-col bg-background">
      <PageHeader
        title="Auto-Schedule"
        subtitle="AI-powered shift scheduling"
        actions={
          <div className="flex items-center gap-2">
            {schedule && !published && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={publishSchedule}
                disabled={publishing || schedule.entries.length === 0}
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Publish
              </Button>
            )}
            {published && (
              <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Published
              </Badge>
            )}
          </div>
        }
      />

      <div className="max-w-5xl mx-auto w-full px-4 lg:px-8 pt-4 pb-24 lg:pb-8 space-y-4">
        {/* Week Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setWeekOffset((w) => w - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <p className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Week of {format(new Date(weekStart + "T00:00:00"), "MMM d, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {weekOffset === 1 ? "Next week" : weekOffset === 0 ? "This week" : `${weekOffset} weeks from now`}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setWeekOffset((w) => w + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-center mt-3">
              <Button className="gap-1.5" onClick={generateSchedule} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate Schedule
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {schedule && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{schedule.stats.filledSlots}</p>
                  <p className="text-xs text-muted-foreground">Shifts Filled</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-amber-500">{schedule.stats.unfilledSlots}</p>
                  <p className="text-xs text-muted-foreground">Unfilled</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{Object.keys(schedule.stats.memberAssignments).length}</p>
                  <p className="text-xs text-muted-foreground">Employees</p>
                </CardContent>
              </Card>
            </div>

            {/* Distribution */}
            {Object.keys(schedule.stats.memberAssignments).length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Assignment Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(schedule.stats.memberAssignments)
                      .sort(([, a], [, b]) => b - a)
                      .map(([name, count]) => (
                        <Badge key={name} variant="secondary" className="text-xs">
                          {name}: {count} shifts
                        </Badge>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Schedule Grid */}
            <div className="space-y-3">
              {weekDates.map((dateStr) => {
                const d = new Date(dateStr + "T00:00:00")
                const dayEntries = entriesByDate[dateStr] || []
                const dayUnfilled = unfilledByDate[dateStr] || []

                if (dayEntries.length === 0 && dayUnfilled.length === 0) return null

                return (
                  <Card key={dateStr}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {DAY_NAMES[d.getDay()]} — {format(d, "MMM d")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 space-y-2">
                      {dayEntries.map((entry) => (
                        <div
                          key={`${entry.shiftId}-${entry.userId}`}
                          className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                        >
                          <div
                            className="w-1 h-8 rounded-full shrink-0"
                            style={{ backgroundColor: entry.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{entry.shiftName}</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.startTime.slice(0, 5)} - {entry.endTime.slice(0, 5)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-medium">{entry.userName}</p>
                            <p className="text-[11px] text-muted-foreground">{entry.reason}</p>
                          </div>
                        </div>
                      ))}
                      {dayUnfilled.map((slot) => (
                        <div
                          key={`unfilled-${slot.shiftId}`}
                          className="flex items-center gap-3 p-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 dark:bg-amber-500/5"
                        >
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">{slot.shiftName}</p>
                            <p className="text-xs text-amber-600/70 dark:text-amber-400/70">{slot.reason}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {schedule.entries.length === 0 && schedule.unfilledSlots.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium">No Shifts to Schedule</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create shifts first, then come back to auto-schedule.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!schedule && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">AI Auto-Scheduling</p>
              <p className="text-sm text-muted-foreground mt-1">
                Select a week and click Generate to create an optimized schedule based on employee availability and fairness.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
