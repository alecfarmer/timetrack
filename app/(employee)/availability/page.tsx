"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { RefreshButton } from "@/components/pull-to-refresh"
import { Loader2, Save, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const DAYS = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
]

type Preference = "preferred" | "available" | "unavailable"

interface DayAvailability {
  dayOfWeek: number
  preference: Preference
  startTime: string
  endTime: string
}

const defaultAvailability: DayAvailability[] = DAYS.map((d) => ({
  dayOfWeek: d.value,
  preference: d.value >= 1 && d.value <= 5 ? "available" : "unavailable",
  startTime: "08:00",
  endTime: "17:00",
}))

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState<DayAvailability[]>(defaultAvailability)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAvailability = useCallback(async () => {
    try {
      const res = await fetch("/api/availability")
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) {
          // Merge fetched data with defaults
          const merged = defaultAvailability.map((def) => {
            const found = data.find((d: DayAvailability) => d.dayOfWeek === def.dayOfWeek)
            if (found) {
              return {
                dayOfWeek: found.dayOfWeek,
                preference: found.preference as Preference,
                startTime: found.startTime?.slice(0, 5) || "08:00",
                endTime: found.endTime?.slice(0, 5) || "17:00",
              }
            }
            return def
          })
          setAvailability(merged)
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAvailability()
  }, [fetchAvailability])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAvailability()
    setRefreshing(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availability: availability.map((a) => ({
            dayOfWeek: a.dayOfWeek,
            preference: a.preference,
            isAvailable: a.preference !== "unavailable",
            startTime: a.preference !== "unavailable" ? a.startTime : null,
            endTime: a.preference !== "unavailable" ? a.endTime : null,
          })),
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  const updateDay = (dayOfWeek: number, updates: Partial<DayAvailability>) => {
    setAvailability((prev) =>
      prev.map((a) => (a.dayOfWeek === dayOfWeek ? { ...a, ...updates } : a))
    )
    setSaved(false)
  }

  const cyclePreference = (dayOfWeek: number) => {
    const current = availability.find((a) => a.dayOfWeek === dayOfWeek)
    if (!current) return
    const order: Preference[] = ["preferred", "available", "unavailable"]
    const idx = order.indexOf(current.preference)
    const next = order[(idx + 1) % order.length]
    updateDay(dayOfWeek, { preference: next })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-background">
      <PageHeader
        title="My Availability"
        subtitle="Set your weekly schedule preferences"
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saved ? "Saved" : "Save"}
            </Button>
            <RefreshButton onRefresh={handleRefresh} refreshing={refreshing} />
          </div>
        }
      />

      <div className="max-w-2xl mx-auto w-full px-4 lg:px-8 pt-4 pb-24 lg:pb-8 space-y-3">
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            Preferred
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            Unavailable
          </span>
        </div>

        {/* Day Cards */}
        {DAYS.map((day) => {
          const a = availability.find((x) => x.dayOfWeek === day.value)!
          return (
            <Card key={day.value}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Day name + preference toggle */}
                  <button
                    onClick={() => cyclePreference(day.value)}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-colors",
                        a.preference === "preferred" && "bg-emerald-500/15 text-emerald-600",
                        a.preference === "available" && "bg-primary/10 text-primary",
                        a.preference === "unavailable" && "bg-muted text-muted-foreground"
                      )}
                    >
                      {day.short.slice(0, 2)}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">{day.label}</p>
                      <Badge
                        variant={
                          a.preference === "preferred"
                            ? "default"
                            : a.preference === "available"
                            ? "secondary"
                            : "outline"
                        }
                        className={cn(
                          "text-[10px] capitalize",
                          a.preference === "preferred" && "bg-emerald-500/15 text-emerald-600 border-emerald-200"
                        )}
                      >
                        {a.preference}
                      </Badge>
                    </div>
                  </button>

                  {/* Time pickers (only if available/preferred) */}
                  {a.preference !== "unavailable" && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="time"
                        value={a.startTime}
                        onChange={(e) => updateDay(day.value, { startTime: e.target.value })}
                        className="rounded-lg border bg-background px-2 py-1.5 text-xs w-[5.5rem]"
                      />
                      <span className="text-xs text-muted-foreground">-</span>
                      <input
                        type="time"
                        value={a.endTime}
                        onChange={(e) => updateDay(day.value, { endTime: e.target.value })}
                        className="rounded-lg border bg-background px-2 py-1.5 text-xs w-[5.5rem]"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        <p className="text-xs text-muted-foreground text-center pt-2">
          Tap a day to cycle between Preferred, Available, and Unavailable. Your manager uses these preferences when building the schedule.
        </p>
      </div>
    </div>
  )
}
