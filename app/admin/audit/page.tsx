"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/bottom-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  ScrollText,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ChevronDown,
  Shield,
  Pencil,
  UserMinus,
  Settings,
  UserPlus,
} from "lucide-react"
import { format } from "date-fns"

interface AuditEntry {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string | null
  details: Record<string, unknown> | null
  createdAt: string
}

const ACTION_ICONS: Record<string, typeof Shield> = {
  ROLE_CHANGE: Shield,
  MEMBER_REMOVED: UserMinus,
  POLICY_UPDATE: Settings,
  ENTRY_CORRECTION: Pencil,
  INVITE_CREATED: UserPlus,
}

const ACTION_COLORS: Record<string, string> = {
  ROLE_CHANGE: "text-violet-500",
  MEMBER_REMOVED: "text-destructive",
  POLICY_UPDATE: "text-blue-500",
  ENTRY_CORRECTION: "text-amber-500",
  INVITE_CREATED: "text-emerald-500",
}

export default function AuditPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const fetchAudit = useCallback(async (loadMore = false) => {
    const currentOffset = loadMore ? offset : 0
    if (!loadMore) setLoading(true)
    try {
      const res = await fetch(`/api/org/audit?limit=30&offset=${currentOffset}`)
      if (res.ok) {
        const data = await res.json()
        if (loadMore) {
          setEntries((prev) => [...prev, ...data.entries])
        } else {
          setEntries(data.entries)
        }
        setHasMore(data.entries.length === 30)
        setOffset(currentOffset + data.entries.length)
      }
    } catch {
      setError("Failed to load audit log")
    } finally {
      setLoading(false)
    }
  }, [offset])

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/")
      return
    }
    if (!authLoading && isAdmin) {
      fetchAudit()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAdmin, router])

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
            <ScrollText className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Audit Log</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 pb-24 lg:pb-8 lg:ml-64">
        <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8 space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {entries.length === 0 && (
            <div className="text-center py-12">
              <ScrollText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No audit entries yet</p>
              <p className="text-xs text-muted-foreground mt-1">Actions will appear here as they occur</p>
            </div>
          )}

          {entries.map((entry) => {
            const Icon = ACTION_ICONS[entry.action] || Settings
            const color = ACTION_COLORS[entry.action] || "text-muted-foreground"

            return (
              <Card key={entry.id} className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{entry.action.replace(/_/g, " ")}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{entry.entityType}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(entry.createdAt), "MMM d, yyyy h:mm a")}
                      </p>
                      {entry.details && (
                        <pre className="text-[11px] text-muted-foreground mt-2 bg-muted/50 rounded-lg p-2 overflow-x-auto">
                          {JSON.stringify(entry.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {hasMore && entries.length > 0 && (
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2"
              onClick={() => fetchAudit(true)}
            >
              <ChevronDown className="h-4 w-4" />
              Load More
            </Button>
          )}
        </div>
      </main>

      <BottomNav currentPath="/admin" />
    </motion.div>
  )
}
