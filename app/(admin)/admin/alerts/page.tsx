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
  Bell,
  BellRing,
  CheckCheck,
  AlertTriangle,
  Clock,
  Info,
  Loader2,
  Inbox,
  BellOff,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AlertNotification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  metadata: Record<string, unknown> | null
  createdAt: string
}

const ALERT_ICONS: Record<string, typeof Bell> = {
  late_arrival: Clock,
  overtime: AlertTriangle,
  missed_clockout: AlertTriangle,
  info: Info,
}

function getAlertIcon(type: string) {
  return ALERT_ICONS[type] || Bell
}

function getAlertColor(type: string) {
  switch (type) {
    case "late_arrival":
      return "text-amber-500 bg-amber-500/10"
    case "overtime":
    case "missed_clockout":
      return "text-red-500 bg-red-500/10"
    default:
      return "text-blue-500 bg-blue-500/10"
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function AlertsPage() {
  const { org, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [notifications, setNotifications] = useState<AlertNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts?limit=50")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
        setTotal(data.total)
      }
    } catch (err) {
      console.error("Failed to fetch alerts:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/")
      return
    }
    if (!authLoading) {
      fetchAlerts()
    }
  }, [authLoading, isAdmin, router, fetchAlerts])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAlerts()
    setRefreshing(false)
  }

  const markAllRead = async () => {
    setMarkingAll(true)
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      })
      await fetchAlerts()
    } catch (err) {
      console.error("Failed to mark all read:", err)
    }
    setMarkingAll(false)
  }

  const markRead = async (id: string) => {
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [id] }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error("Failed to mark read:", err)
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
          <p className="text-muted-foreground font-medium">Loading alerts...</p>
        </motion.div>
      </div>
    )
  }

  const readCount = total - unreadCount

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Premium Dark Hero Header */}
      <div className="hidden lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />

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
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                <BellRing className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Alerts</h1>
                {org && (
                  <p className="text-xs text-white/60">{org.orgName}</p>
                )}
              </div>
              {unreadCount > 0 && (
                <Badge className="rounded-full bg-orange-500 text-white border-0">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={markAllRead}
                  disabled={markingAll}
                  className="gap-2 text-white/70 hover:text-white hover:bg-white/10"
                >
                  {markingAll ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Mark all read</span>
                </Button>
              )}
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
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center mx-auto mb-2">
                <Bell className="h-5 w-5 text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-white">{total}</p>
              <p className="text-xs text-white/60">Total Alerts</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/10 text-center relative">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
                <BellRing className="h-5 w-5 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-amber-400">{unreadCount}</p>
              <p className="text-xs text-white/60">Unread</p>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              )}
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                <CheckCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">{readCount}</p>
              <p className="text-xs text-white/60">Read</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 lg:pb-8 pt-6">
        <div className="max-w-3xl mx-auto px-4 lg:px-8">
          {notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Inbox className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">No alerts yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Alerts will appear here when rules are triggered
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif, index) => {
                const Icon = getAlertIcon(notif.type)
                const color = getAlertColor(notif.type)
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={cn(
                        "border-0 shadow-md cursor-pointer transition-all hover:shadow-lg rounded-2xl",
                        !notif.isRead && "ring-1 ring-orange-500/20 bg-orange-500/[0.02]"
                      )}
                      onClick={() => !notif.isRead && markRead(notif.id)}
                    >
                      <CardContent className="p-4 flex items-start gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                            color
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn("text-sm font-medium", !notif.isRead && "font-semibold")}>
                              {notif.title}
                            </p>
                            {!notif.isRead && (
                              <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 animate-pulse" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {timeAgo(notif.createdAt)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </motion.div>
  )
}
