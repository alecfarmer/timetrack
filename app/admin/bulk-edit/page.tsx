"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/bottom-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
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
        headers: { "Content-Type": "application/json" },
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <motion.div className="flex flex-col min-h-screen bg-background" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="sticky top-0 z-50 glass border-b lg:ml-64">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => router.push("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Edit3 className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Bulk Edit</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 pb-24 lg:pb-8 lg:ml-64">
        <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-success/10 border border-success/20 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <p className="text-sm text-success">{success}</p>
            </div>
          )}

          {/* Action Bar */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground">
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
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 rounded-xl text-destructive"
                      onClick={() => handleBulkAction("REJECTED")}
                      disabled={processing}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Corrections List */}
          {corrections.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-lg font-medium">No pending corrections</p>
                <p className="text-sm text-muted-foreground">All correction requests have been processed.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {corrections.map((correction) => (
                <Card
                  key={correction.id}
                  className={`border-0 shadow-lg cursor-pointer transition-shadow ${
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
                          <Badge variant="outline" className="text-xs">{correction.field}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Old value</p>
                            <p className="font-mono">{correction.oldValue}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">New value</p>
                            <p className="font-mono font-medium">{correction.newValue}</p>
                          </div>
                        </div>
                        {correction.reason && (
                          <p className="text-xs text-muted-foreground">
                            Reason: {correction.reason}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(correction.createdAt), "MMM d, yyyy HH:mm")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav currentPath="/admin" />
    </motion.div>
  )
}
