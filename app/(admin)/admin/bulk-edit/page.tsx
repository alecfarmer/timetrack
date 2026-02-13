"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenter } from "@/components/notification-center"
import { RefreshButton } from "@/components/pull-to-refresh"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { tzHeaders } from "@/lib/utils"
import { format, subDays } from "date-fns"
import {
  ArrowLeft,
  Loader2,
  Edit3,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  FileEdit,
  ListChecks,
} from "lucide-react"

interface Correction {
  id: string
  entryId: string
  field: string
  oldValue: string
  newValue: string
  reason: string
  status: string
  createdAt: string
  user?: { email: string }
}

export default function BulkEditPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [corrections, setCorrections] = useState<Correction[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchCorrections = useCallback(async () => {
    try {
      const res = await fetch("/api/entries/corrections?status=PENDING")
      if (res.ok) {
        setCorrections(await res.json())
      }
    } catch {
      setError("Failed to load corrections")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/")
      return
    }
    if (!authLoading && isAdmin) {
      fetchCorrections()
    }
  }, [authLoading, isAdmin, router, fetchCorrections])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchCorrections()
    setRefreshing(false)
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === corrections.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(corrections.map((c) => c.id)))
    }
  }

  const handleBulkAction = async (action: "APPROVED" | "REJECTED") => {
    if (selected.size === 0) return
    setProcessing(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/entries/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...tzHeaders() },
        body: JSON.stringify({
          correctionIds: Array.from(selected),
          action,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to process")
      }
      const data = await res.json()
      setSuccess(`${data.processed} correction(s) ${action.toLowerCase()}`)
      setSelected(new Set())
      await fetchCorrections()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process corrections")
    } finally {
      setProcessing(false)
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
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
          <p className="text-muted-foreground font-medium">Loading corrections...</p>
        </motion.div>
      </div>
    )
  }

  // Get unique field types for stats
  const fieldTypes = corrections.reduce((acc, c) => {
    acc[c.field] = (acc[c.field] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Premium Dark Hero Header */}
      <div className="hidden lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-rose-500/10 via-transparent to-transparent" />

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
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => router.push("/admin")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                <Edit3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Bulk Edit</h1>
                <p className="text-xs text-white/60">Entry Corrections</p>
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
            <div className="bg-white/10 rounded-xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center mx-auto mb-2">
                <FileEdit className="h-5 w-5 text-pink-400" />
              </div>
              <p className="text-2xl font-bold text-white">{corrections.length}</p>
              <p className="text-xs text-white/60">Pending</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center mx-auto mb-2">
                <ListChecks className="h-5 w-5 text-rose-400" />
              </div>
              <p className="text-2xl font-bold text-rose-400">{selected.size}</p>
              <p className="text-xs text-white/60">Selected</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-2">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{Object.keys(fieldTypes).length}</p>
              <p className="text-xs text-white/60">Field Types</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 lg:pb-8 pt-6">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-6">
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
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-success/10 border border-success/20 rounded-xl p-4 flex items-center gap-3"
            >
              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
              <p className="text-sm text-success flex-1">{success}</p>
              <Button variant="ghost" size="sm" onClick={() => setSuccess(null)}>Dismiss</Button>
            </motion.div>
          )}

          {/* Action Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground transition-colors">
                      {selected.size === corrections.length && corrections.length > 0 ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                    <span className="text-sm text-muted-foreground">
                      {selected.size > 0
                        ? `${selected.size} selected`
                        : `${corrections.length} pending correction(s)`}
                    </span>
                  </div>
                  {selected.size > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="gap-1.5 rounded-xl"
                        onClick={() => handleBulkAction("APPROVED")}
                        disabled={processing}
                      >
                        {processing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 rounded-xl text-destructive hover:text-destructive"
                        onClick={() => handleBulkAction("REJECTED")}
                        disabled={processing}
                      >
                        {processing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Corrections List */}
          {corrections.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium">No pending corrections</p>
                  <p className="text-sm text-muted-foreground mt-1">All correction requests have been processed.</p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {corrections.map((correction, index) => (
                <motion.div
                  key={correction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Card
                    className={`border-0 shadow-lg cursor-pointer transition-all rounded-2xl hover:shadow-xl ${
                      selected.has(correction.id) ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => toggleSelect(correction.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="pt-0.5">
                          {selected.has(correction.id) ? (
                            <CheckSquare className="h-5 w-5 text-primary" />
                          ) : (
                            <Square className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{correction.user?.email || "Unknown user"}</p>
                            <Badge variant="outline" className="text-xs rounded-lg">{correction.field}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-2 bg-muted/50 rounded-xl">
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Old value</p>
                              <p className="font-mono text-xs">{correction.oldValue}</p>
                            </div>
                            <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">New value</p>
                              <p className="font-mono text-xs font-medium">{correction.newValue}</p>
                            </div>
                          </div>
                          {correction.reason && (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Reason:</span> {correction.reason}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(correction.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </motion.div>
  )
}
