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
  ScrollText,
  ChevronDown,
  Shield,
  Pencil,
  UserMinus,
  Settings,
  UserPlus,
  AlertCircle,
  Clock,
  Activity,
  FileEdit,
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
  const { org, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
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

  const handleRefresh = async () => {
    setRefreshing(true)
    setOffset(0)
    await fetchAudit(false)
    setRefreshing(false)
  }

  // Calculate stats from entries
  const stats = {
    total: entries.length,
    roleChanges: entries.filter(e => e.action === "ROLE_CHANGE").length,
    policyUpdates: entries.filter(e => e.action === "POLICY_UPDATE").length,
    corrections: entries.filter(e => e.action === "ENTRY_CORRECTION").length,
    memberRemovals: entries.filter(e => e.action === "MEMBER_REMOVED").length,
    invites: entries.filter(e => e.action === "INVITE_CREATED").length,
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
            <div className="w-16 h-16 rounded-full bg-amber-500/20 animate-ping absolute inset-0" />
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <ScrollText className="h-8 w-8 text-amber-500" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Loading audit log...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div className="flex flex-col min-h-screen bg-background" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Premium Dark Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent" />
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
                <ScrollText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Audit Log</h1>
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
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-2">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-white/60">Total</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center mx-auto mb-2">
                <Shield className="h-5 w-5 text-violet-400" />
              </div>
              <p className="text-2xl font-bold text-violet-400">{stats.roleChanges}</p>
              <p className="text-xs text-white/60">Role Changes</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                <Settings className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-400">{stats.policyUpdates}</p>
              <p className="text-xs text-white/60">Policy Updates</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
                <FileEdit className="h-5 w-5 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-amber-400">{stats.corrections}</p>
              <p className="text-xs text-white/60">Corrections</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center mx-auto mb-2">
                <UserMinus className="h-5 w-5 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-400">{stats.memberRemovals}</p>
              <p className="text-xs text-white/60">Removals</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                <UserPlus className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">{stats.invites}</p>
              <p className="text-xs text-white/60">Invites</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 lg:pb-8 -mt-4">
        <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8 space-y-4">
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

          {entries.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <ScrollText className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground font-medium">No audit entries yet</p>
              <p className="text-xs text-muted-foreground mt-1">Actions will appear here as they occur</p>
            </motion.div>
          )}

          {entries.map((entry, index) => {
            const Icon = ACTION_ICONS[entry.action] || Settings
            const color = ACTION_COLORS[entry.action] || "text-muted-foreground"

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="border-0 shadow-lg rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] font-medium">{entry.action.replace(/_/g, " ")}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{entry.entityType}</Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                          <Clock className="h-3 w-3" />
                          {format(new Date(entry.createdAt), "MMM d, yyyy h:mm a")}
                        </div>
                        {entry.details && (
                          <pre className="text-[11px] text-muted-foreground mt-3 bg-muted/50 rounded-xl p-3 overflow-x-auto font-mono">
                            {JSON.stringify(entry.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}

          {hasMore && entries.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                variant="outline"
                className="w-full rounded-xl gap-2 h-12"
                onClick={() => fetchAudit(true)}
              >
                <ChevronDown className="h-4 w-4" />
                Load More
              </Button>
            </motion.div>
          )}
        </div>
      </main>
    </motion.div>
  )
}
