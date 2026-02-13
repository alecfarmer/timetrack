"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { RefreshButton } from "@/components/pull-to-refresh"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  ClipboardCheck,
  Loader2,
  Check,
  X,
  AlertCircle,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  HourglassIcon,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Timesheet {
  id: string
  userId: string
  email?: string
  weekStart: string
  weekEnd: string
  status: string
  totalMinutes: number
  totalDays: number
  submittedAt: string
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
}

type FilterStatus = "PENDING" | "APPROVED" | "REJECTED"

export default function TimesheetsPage() {
  const { org, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [allTimesheets, setAllTimesheets] = useState<Timesheet[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterStatus>("PENDING")
  const [processing, setProcessing] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())

  const fetchTimesheets = useCallback(async () => {
    try {
      // Fetch all timesheets in a single call, filter client-side
      const res = await fetch("/api/timesheets")
      if (res.ok) {
        const data: Timesheet[] = await res.json()
        setAllTimesheets(data)
      }
    } catch {
      setError("Failed to load timesheets")
    } finally {
      setLoading(false)
    }
  }, [])

  // Filter client-side
  useEffect(() => {
    setTimesheets(allTimesheets.filter((ts) => ts.status === filter))
    setSelected(new Set())
  }, [allTimesheets, filter])

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/")
      return
    }
    if (!authLoading && isAdmin) {
      fetchTimesheets()
    }
  }, [authLoading, isAdmin, router, fetchTimesheets])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchTimesheets()
    setRefreshing(false)
  }

  const handleReview = async (submissionId: string, action: "APPROVED" | "REJECTED") => {
    setProcessing((prev) => new Set(prev).add(submissionId))
    try {
      const res = await fetch("/api/timesheets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, action }),
      })
      if (!res.ok) throw new Error("Failed to review")
      await fetchTimesheets()
    } catch {
      setError("Failed to process review")
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev)
        next.delete(submissionId)
        return next
      })
    }
  }

  const handleBatchReview = async (action: "APPROVED" | "REJECTED") => {
    const ids = Array.from(selected)
    if (ids.length === 0) return

    // Mark all as processing
    setProcessing(new Set(ids))
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch("/api/timesheets", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ submissionId: id, action }),
          })
        )
      )
      const failures = results.filter((r) => r.status === "rejected").length
      if (failures > 0) {
        setError(`${failures} of ${ids.length} reviews failed`)
      }
      await fetchTimesheets()
    } catch {
      setError("Batch review failed")
    } finally {
      setProcessing(new Set())
      setSelected(new Set())
    }
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    const pendingIds = timesheets.filter((ts) => ts.status === "PENDING").map((ts) => ts.id)
    if (selected.size === pendingIds.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(pendingIds))
    }
  }

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const formatHours = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}h ${m}m`
  }

  // Compute stats from all timesheets
  const stats = {
    pending: allTimesheets.filter((ts) => ts.status === "PENDING").length,
    approved: allTimesheets.filter((ts) => ts.status === "APPROVED").length,
    rejected: allTimesheets.filter((ts) => ts.status === "REJECTED").length,
  }

  // Group timesheets by user
  const groupedByUser = timesheets.reduce((acc, ts) => {
    const key = ts.email || ts.userId.slice(0, 8)
    if (!acc[key]) acc[key] = { userId: ts.userId, email: key, timesheets: [] }
    acc[key].timesheets.push(ts)
    return acc
  }, {} as Record<string, { userId: string; email: string; timesheets: Timesheet[] }>)

  const userGroups = Object.values(groupedByUser).sort((a, b) =>
    b.timesheets.length - a.timesheets.length
  )

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-32 bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading timesheets...</p>
        </div>
      </div>
    )
  }

  const pendingIds = timesheets.filter((ts) => ts.status === "PENDING").map((ts) => ts.id)
  const allSelected = pendingIds.length > 0 && selected.size === pendingIds.length

  return (
    <div className="flex flex-col bg-background">
      <PageHeader
        title="Timesheets"
        subtitle={org ? org.orgName : "Timesheet approvals"}
        actions={
          <RefreshButton onRefresh={handleRefresh} refreshing={refreshing} />
        }
      />

      <div className="max-w-4xl mx-auto w-full px-4 lg:px-8 pt-4 pb-24 lg:pb-8 space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex gap-2">
          {([
            { key: "PENDING" as FilterStatus, label: "Pending", count: stats.pending, icon: HourglassIcon, color: "text-amber-500" },
            { key: "APPROVED" as FilterStatus, label: "Approved", count: stats.approved, icon: CheckCircle2, color: "text-emerald-500" },
            { key: "REJECTED" as FilterStatus, label: "Rejected", count: stats.rejected, icon: XCircle, color: "text-rose-500" },
          ]).map(({ key, label, count, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                filter === key
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className={cn("h-4 w-4", filter === key ? "text-primary" : color)} />
              <span>{label}</span>
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                {count}
              </Badge>
            </button>
          ))}
        </div>

        {/* Batch Action Bar */}
        {filter === "PENDING" && pendingIds.length > 0 && (
          <Card>
            <CardContent className="p-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-muted-foreground/30"
                />
                <span className="text-muted-foreground">
                  {selected.size > 0
                    ? `${selected.size} of ${pendingIds.length} selected`
                    : "Select all"}
                </span>
              </label>
              {selected.size > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    onClick={() => handleBatchReview("APPROVED")}
                    disabled={processing.size > 0}
                  >
                    {processing.size > 0 ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Approve ({selected.size})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                    onClick={() => handleBatchReview("REJECTED")}
                    disabled={processing.size > 0}
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject ({selected.size})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive flex-1">{error}</p>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>Dismiss</Button>
          </div>
        )}

        {/* Empty State */}
        {timesheets.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-medium">No {filter.toLowerCase()} timesheets</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {filter === "PENDING"
                ? "All caught up! No timesheets waiting for review."
                : `No timesheets have been ${filter.toLowerCase()} yet.`}
            </p>
          </div>
        )}

        {/* Grouped Timesheet List */}
        {userGroups.map((group) => {
          const isExpanded = expandedUsers.has(group.userId)
          const totalMinutes = group.timesheets.reduce((sum, ts) => sum + ts.totalMinutes, 0)
          const showTimesheets = group.timesheets.length === 1 ? group.timesheets : (isExpanded ? group.timesheets : group.timesheets.slice(0, 1))

          return (
            <div key={group.userId} className="space-y-2">
              {/* User Header */}
              {group.timesheets.length > 1 && (
                <button
                  onClick={() => toggleUserExpanded(group.userId)}
                  className="flex items-center gap-2 w-full text-left px-1"
                >
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium flex-1">{group.email}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatHours(totalMinutes)} total
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {group.timesheets.length} sheets
                  </Badge>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              )}

              {showTimesheets.map((ts) => (
                <Card key={ts.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox for pending */}
                      {ts.status === "PENDING" && (
                        <input
                          type="checkbox"
                          checked={selected.has(ts.id)}
                          onChange={() => toggleSelect(ts.id)}
                          className="mt-1 rounded border-muted-foreground/30"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">
                            {group.timesheets.length === 1 ? group.email : (
                              <span className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                {format(new Date(ts.weekStart), "MMM d")} – {format(new Date(ts.weekEnd), "MMM d")}
                              </span>
                            )}
                          </p>
                          <Badge
                            variant={
                              ts.status === "APPROVED" ? "default" :
                              ts.status === "REJECTED" ? "destructive" : "secondary"
                            }
                          >
                            {ts.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {group.timesheets.length === 1 && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(ts.weekStart), "MMM d")} – {format(new Date(ts.weekEnd), "MMM d")}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatHours(ts.totalMinutes)}
                          </span>
                          <span>{ts.totalDays} days</span>
                        </div>

                        <p className="text-[11px] text-muted-foreground mt-1">
                          Submitted {format(new Date(ts.submittedAt), "MMM d, h:mm a")}
                        </p>

                        {ts.reviewNotes && (
                          <p className="text-xs text-muted-foreground italic mt-1">{ts.reviewNotes}</p>
                        )}
                      </div>

                      {/* Individual action buttons */}
                      {ts.status === "PENDING" && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-600 hover:bg-emerald-500/10"
                            onClick={() => handleReview(ts.id, "APPROVED")}
                            disabled={processing.has(ts.id)}
                          >
                            {processing.has(ts.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-rose-600 hover:text-rose-600 hover:bg-rose-500/10"
                            onClick={() => handleReview(ts.id, "REJECTED")}
                            disabled={processing.has(ts.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {!isExpanded && group.timesheets.length > 1 && (
                <button
                  onClick={() => toggleUserExpanded(group.userId)}
                  className="text-xs text-primary hover:underline pl-6"
                >
                  Show {group.timesheets.length - 1} more...
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
