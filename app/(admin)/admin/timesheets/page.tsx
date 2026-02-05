"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  ClipboardCheck,
  ArrowLeft,
  Loader2,
  Check,
  X,
  AlertCircle,
  Clock,
  Calendar,
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

export default function TimesheetsPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState("PENDING")
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchTimesheets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/timesheets?status=${filter}`)
      if (res.ok) {
        setTimesheets(await res.json())
      }
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <motion.div className="flex flex-col min-h-screen bg-background" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="sticky top-0 z-50 glass border-b">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => router.push("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Timesheets</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-lg p-0.5">
              {["PENDING", "APPROVED", "REJECTED"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    filter === s ? "bg-background shadow text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 lg:pb-8">
        <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8 space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {timesheets.length === 0 && (
            <div className="text-center py-12">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No {filter.toLowerCase()} timesheets</p>
            </div>
          )}

          {timesheets.map((ts) => (
            <Card key={ts.id} className="border-0 shadow-lg">
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
                          className="h-8 w-8 text-success hover:text-success"
                          onClick={() => handleReview(ts.id, "APPROVED")}
                          disabled={processing === ts.id}
                        >
                          {processing === ts.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
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
          ))}
        </div>
      </main>
    </motion.div>
  )
}
