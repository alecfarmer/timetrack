"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { RefreshButton } from "@/components/pull-to-refresh"
import { formatRelative } from "@/lib/dates"
import {
  Bell,
  BellOff,
  CheckCheck,
  Loader2,
  AlertTriangle,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

const typeIcons: Record<string, React.ElementType> = {
  OVERTIME_APPROACHING: TrendingUp,
  LATE_ARRIVAL: Clock,
  MISSED_CLOCK_OUT: AlertTriangle,
}

const typeColors: Record<string, string> = {
  OVERTIME_APPROACHING: "text-amber-500 bg-amber-500/10",
  LATE_ARRIVAL: "text-rose-500 bg-rose-500/10",
  MISSED_CLOCK_OUT: "text-orange-500 bg-orange-500/10",
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/alerts?limit=50")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {
      // Silently fail
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchNotifications()
      setLoading(false)
    }
    loadData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchNotifications()
    setRefreshing(false)
  }

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds }),
      })
      setNotifications((prev) =>
        prev.map((n) =>
          notificationIds.includes(n.id) ? { ...n, isRead: true } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - notificationIds.length))
    } catch {
      // Silently fail
    }
  }

  const markAllRead = async () => {
    setMarkingAll(true)
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      // Silently fail
    } finally {
      setMarkingAll(false)
    }
  }

  if (loading) {
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
              <Bell className="h-8 w-8 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Loading notifications...</p>
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
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                onClick={markAllRead}
                disabled={markingAll}
              >
                {markingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                Mark all read
              </Button>
            )}
            <RefreshButton onRefresh={handleRefresh} refreshing={refreshing} />
          </div>
        }
      />

      {/* Stats */}
      <div className="px-4 pt-4 pb-2 max-w-2xl mx-auto lg:px-8">
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-lg rounded-2xl text-center p-4">
            <p className="text-2xl font-bold">{unreadCount}</p>
            <p className="text-xs text-muted-foreground">Unread</p>
          </Card>
          <Card className="border-0 shadow-lg rounded-2xl text-center p-4">
            <p className="text-2xl font-bold">{notifications.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 lg:pb-8">
        <div className="max-w-2xl mx-auto px-4 lg:px-8">
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
                <BellOff className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground font-medium">No notifications</p>
              <p className="text-sm text-muted-foreground/60 mt-1">You're all caught up</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif, i) => {
                const Icon = typeIcons[notif.type] || AlertCircle
                const colorClass = typeColors[notif.type] || "text-muted-foreground bg-muted"

                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card
                      className={cn(
                        "border-0 shadow-lg rounded-2xl transition-all cursor-pointer hover:shadow-xl",
                        !notif.isRead && "ring-1 ring-primary/20 bg-primary/[0.02]"
                      )}
                      onClick={() => {
                        if (!notif.isRead) markAsRead([notif.id])
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-xl flex-shrink-0", colorClass)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={cn("text-sm font-medium", !notif.isRead && "font-semibold")}>
                                {notif.title}
                              </p>
                              {!notif.isRead && (
                                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">{formatRelative(notif.createdAt)}</p>
                          </div>
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
