"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDuration } from "@/lib/dates"
import { startOfWeek, format, subWeeks, addDays } from "date-fns"
import {
  FileText,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TimesheetSubmission {
  id: string
  weekStart: string
  weekEnd: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  totalMinutes: number
  totalDays: number
  submittedAt: string
  reviewNotes?: string | null
}

interface DayBreakdown {
  date: string
  totalMinutes: number
  entryCount: number
}

export function TimesheetSubmit() {
  const [submissions, setSubmissions] = useState<TimesheetSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewWeek, setPreviewWeek] = useState<string | null>(null)
  const [dailyBreakdown, setDailyBreakdown] = useState<DayBreakdown[]>([])
  const [loadingBreakdown, setLoadingBreakdown] = useState(false)

  const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
  const lastWeekStart = format(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), "yyyy-MM-dd")

  useEffect(() => {
    fetchTimesheets()
  }, [])

  const fetchTimesheets = async () => {
    try {
      const res = await fetch("/api/timesheets")
      if (!res.ok) throw new Error("Failed to fetch timesheets")
      const data = await res.json()
      setSubmissions(data || [])
    } catch {
      // Non-critical
    } finally {
      setLoading(false)
    }
  }

  const fetchDailyBreakdown = async (weekStart: string) => {
    setLoadingBreakdown(true)
    try {
      const weekEnd = format(addDays(new Date(weekStart + "T00:00:00"), 6), "yyyy-MM-dd")
      const res = await fetch(`/api/timesheets/preview?weekStart=${weekStart}&weekEnd=${weekEnd}`)
      if (res.ok) {
        const data = await res.json()
        setDailyBreakdown(data.days || [])
      }
    } catch {
      // Fallback — just show submit without preview
      setDailyBreakdown([])
    } finally {
      setLoadingBreakdown(false)
    }
  }

  const togglePreview = async (weekStart: string) => {
    if (previewWeek === weekStart) {
      setPreviewWeek(null)
      setDailyBreakdown([])
    } else {
      setPreviewWeek(weekStart)
      await fetchDailyBreakdown(weekStart)
    }
  }

  const handleSubmit = async (weekStart: string) => {
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch("/api/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to submit timesheet")
      }

      setSuccess("Timesheet submitted for approval")
      setPreviewWeek(null)
      setDailyBreakdown([])
      await fetchTimesheets()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit")
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="success" className="gap-1 text-xs"><CheckCircle2 className="h-3 w-3" />Approved</Badge>
      case "REJECTED":
        return <Badge variant="destructive" className="gap-1 text-xs"><XCircle className="h-3 w-3" />Rejected</Badge>
      default:
        return <Badge variant="warning" className="gap-1 text-xs"><Clock className="h-3 w-3" />Pending</Badge>
    }
  }

  const isWeekSubmitted = (weekStart: string) =>
    submissions.some((s) => s.weekStart === weekStart)

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading timesheets...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">Timesheets</h3>
        </div>

        {/* Submit buttons for current and last week */}
        <div className="space-y-2">
          {[
            { label: "Last Week", weekStart: lastWeekStart },
            { label: "Current Week", weekStart: currentWeekStart },
          ].map(({ label, weekStart }) => {
            const submitted = isWeekSubmitted(weekStart)
            const submission = submissions.find((s) => s.weekStart === weekStart)
            const isPreview = previewWeek === weekStart

            return (
              <div key={weekStart} className="space-y-0">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      Week of {format(new Date(weekStart + "T00:00:00"), "MMM d")}
                    </p>
                    {submission && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDuration(submission.totalMinutes)} · {submission.totalDays} days
                      </p>
                    )}
                  </div>
                  {submitted ? (
                    getStatusBadge(submission!.status)
                  ) : (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-xs"
                        onClick={() => togglePreview(weekStart)}
                      >
                        {isPreview ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                        Review
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => handleSubmit(weekStart)}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        Submit
                      </Button>
                    </div>
                  )}
                </div>

                {/* Daily Breakdown Preview */}
                {isPreview && (
                  <div className="border rounded-lg mx-1 mt-1 mb-2 overflow-hidden">
                    {loadingBreakdown ? (
                      <div className="p-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading breakdown...
                      </div>
                    ) : dailyBreakdown.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground">
                        No work entries found for this week.
                      </div>
                    ) : (
                      <>
                        <div className="divide-y">
                          {dailyBreakdown.map((day) => (
                            <div key={day.date} className="flex items-center justify-between px-3 py-2 text-xs">
                              <span className="font-medium">
                                {format(new Date(day.date + "T00:00:00"), "EEE, MMM d")}
                              </span>
                              <span className={cn(
                                "tabular-nums",
                                day.totalMinutes > 0 ? "text-foreground" : "text-muted-foreground"
                              )}>
                                {formatDuration(day.totalMinutes)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 bg-muted/50 text-xs font-medium border-t">
                          <span>Total</span>
                          <span className="tabular-nums">
                            {formatDuration(dailyBreakdown.reduce((sum, d) => sum + d.totalMinutes, 0))}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {success && (
          <p className="text-sm text-success">{success}</p>
        )}

        {/* Past submissions */}
        {submissions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">History</p>
            {submissions.slice(0, 8).map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                <div>
                  <span className="font-mono text-xs">
                    {format(new Date(s.weekStart + "T00:00:00"), "MMM d")} – {format(new Date(s.weekEnd + "T00:00:00"), "MMM d")}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatDuration(s.totalMinutes)}
                  </span>
                </div>
                {getStatusBadge(s.status)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
