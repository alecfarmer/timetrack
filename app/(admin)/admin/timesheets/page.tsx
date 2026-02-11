"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenter } from "@/components/notification-center"
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
} from "lucide-react"
import { format } from "date-fns"

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

interface TimesheetStats {
  pending: number
  approved: number
  rejected: number
}

export default function TimesheetsPage() {
  const { org, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [stats, setStats] = useState<TimesheetStats>({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState("PENDING")
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchTimesheets = useCallback(async () => {
    try {
      const [timesheetsRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
        fetch(`/api/timesheets?status=${filter}`),
        fetch(`/api/timesheets?status=PENDING&countOnly=true`),
        fetch(`/api/timesheets?status=APPROVED&countOnly=true`),
        fetch(`/api/timesheets?status=REJECTED&countOnly=true`),
      ])

      if (timesheetsRes.ok) {
        setTimesheets(await timesheetsRes.json())
      }

      // Update stats
      const pendingCount = pendingRes.ok ? (await pendingRes.json()).count ?? 0 : 0
      const approvedCount = approvedRes.ok ? (await approvedRes.json()).count ?? 0 : 0
      const rejectedCount = rejectedRes.ok ? (await rejectedRes.json()).count ?? 0 : 0
      setStats({ pending: pendingCount, approved: approvedCount, rejected: rejectedCount })
    } catch {
      setError("Failed to load timesheets")
    } finally {
      setLoading(false)
    }
  }, [filter])

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
    setProcessing(submissionId)
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
      setProcessing(null)
    }
  }

  const formatHours = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}h ${m}m`
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "secondary"
      case "APPROVED": return "default"
      case "REJECTED": return "destructive"
      default: return "secondary"
    }
  }

  if (authLoading || loading) {
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
              <ClipboardCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Loading timesheets...</p>
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
      <div className="hidden lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent" />
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
                <ClipboardCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Timesheets</h1>
                {org && (
                  <p className="text-xs text-white/60">{org.orgName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RefreshButton onRefresh={handleRefresh} refreshing={refreshing} className="text-white/70 hover:text-white hover:bg-white/10" />
              <ThemeToggle />
              <NotificationCenter />
            </div>
          </div>
        </header>

        {/* Stats Cards in Hero */}
        <div className="relative z-10 px-4 pt-4 pb-6 max-w-6xl mx-auto lg:px-8">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setFilter("PENDING")}
              className={`bg-white/5 backdrop-blur-sm rounded-2xl p-4 border text-center transition-all ${
                filter === "PENDING" ? "border-amber-400/50 ring-1 ring-amber-400/30" : "border-white/10 hover:border-white/20"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
                <HourglassIcon className="h-5 w-5 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
              <p className="text-xs text-white/60">Pending</p>
              {stats.pending > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setFilter("APPROVED")}
              className={`bg-white/5 backdrop-blur-sm rounded-2xl p-4 border text-center transition-all ${
                filter === "APPROVED" ? "border-emerald-400/50 ring-1 ring-emerald-400/30" : "border-white/10 hover:border-white/20"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">{stats.approved}</p>
              <p className="text-xs text-white/60">Approved</p>
            </button>
            <button
              onClick={() => setFilter("REJECTED")}
              className={`bg-white/5 backdrop-blur-sm rounded-2xl p-4 border text-center transition-all ${
                filter === "REJECTED" ? "border-rose-400/50 ring-1 ring-rose-400/30" : "border-white/10 hover:border-white/20"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center mx-auto mb-2">
                <XCircle className="h-5 w-5 text-rose-400" />
              </div>
              <p className="text-2xl font-bold text-rose-400">{stats.rejected}</p>
              <p className="text-xs text-white/60">Rejected</p>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 lg:pb-8 -mt-4">
        <div className="max-w-3xl mx-auto px-4 lg:px-8 space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive flex-1">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>Dismiss</Button>
            </motion.div>
          )}

          {timesheets.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <ClipboardCheck className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground font-medium">No {filter.toLowerCase()} timesheets</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {filter === "PENDING" ? "All caught up! No timesheets waiting for review." : `No timesheets have been ${filter.toLowerCase()} yet.`}
              </p>
            </motion.div>
          )}

          {timesheets.map((ts, index) => (
            <motion.div
              key={ts.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{ts.email || ts.userId.slice(0, 8)}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(ts.weekStart), "MMM d")} - {format(new Date(ts.weekEnd), "MMM d")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatHours(ts.totalMinutes)}
                        </span>
                        <span>{ts.totalDays} days</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Submitted {format(new Date(ts.submittedAt), "MMM d, h:mm a")}
                      </p>
                      {ts.reviewNotes && (
                        <p className="text-xs text-muted-foreground italic mt-1">{ts.reviewNotes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusColor(ts.status) as "default" | "secondary" | "destructive"}>{ts.status}</Badge>
                      {ts.status === "PENDING" && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                            onClick={() => handleReview(ts.id, "APPROVED")}
                            disabled={processing === ts.id}
                          >
                            {processing === ts.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleReview(ts.id, "REJECTED")}
                            disabled={processing === ts.id}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </motion.div>
  )
}
