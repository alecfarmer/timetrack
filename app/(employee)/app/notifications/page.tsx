"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
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
  OVERTIME_APPROACHING: "text-warning bg-warning/10",
  LATE_ARRIVAL: "text-destructive bg-destructive/10",
  MISSED_CLOCK_OUT: "text-orange-500 bg-orange-500/10",
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/alerts?limit=50")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading notifications...</p>
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
      <header className="sticky top-0 z-50 glass border-b">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center lg:hidden">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold lg:text-xl lg:font-semibold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">{unreadCount} new</Badge>
            )}
          </div>
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
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 lg:pb-8">
        <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8">
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
                        "transition-all cursor-pointer hover:shadow-md",
                        !notif.isRead && "border-l-4 border-l-primary bg-primary/[0.02]"
                      )}
                      onClick={() => {
                        if (!notif.isRead) markAsRead([notif.id])
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg flex-shrink-0", colorClass)}>
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
