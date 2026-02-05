"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  Bell,
  ArrowLeft,
  CheckCheck,
  AlertTriangle,
  Clock,
  Info,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

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
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [notifications, setNotifications] = useState<AlertNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
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

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className="sticky top-0 z-50 glass border-b">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="rounded-xl lg:hidden">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold lg:text-xl">Alerts</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={markAllRead}
                disabled={markingAll}
                className="gap-2 rounded-xl"
              >
                {markingAll ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 lg:pb-8">
        <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No alerts yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Alerts will appear here when rules are triggered
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => {
                const Icon = getAlertIcon(notif.type)
                const color = getAlertColor(notif.type)
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card
                      className={cn(
                        "border-0 shadow-md cursor-pointer transition-all hover:shadow-lg",
                        !notif.isRead && "ring-1 ring-primary/20 bg-primary/[0.02]"
                      )}
                      onClick={() => !notif.isRead && markRead(notif.id)}
                    >
                      <CardContent className="p-4 flex items-start gap-3">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
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
                              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
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
