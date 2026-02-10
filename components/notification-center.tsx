"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRealtime } from "@/contexts/realtime-context"
import { formatRelative } from "@/lib/dates"
import { cn } from "@/lib/utils"
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Clock,
  Trophy,
  AlertTriangle,
  Calendar,
  MapPin,
  Users,
  Flame,
  Coffee,
  FileCheck,
  Settings,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import Link from "next/link"

// Notification type icons
const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  CLOCK_IN: MapPin,
  CLOCK_OUT: MapPin,
  BREAK_REMINDER: Coffee,
  COMPLIANCE_WARNING: AlertTriangle,
  COMPLIANCE_ACHIEVED: Check,
  BADGE_EARNED: Trophy,
  XP_MILESTONE: Sparkles,
  STREAK_MILESTONE: Flame,
  TIMESHEET_APPROVED: FileCheck,
  TIMESHEET_REJECTED: AlertTriangle,
  TEAM_UPDATE: Users,
  SCHEDULE_CHANGE: Calendar,
  OVERTIME_WARNING: Clock,
  SYSTEM: Settings,
}

const NOTIFICATION_COLORS: Record<string, string> = {
  CLOCK_IN: "text-emerald-500 bg-emerald-500/10",
  CLOCK_OUT: "text-rose-500 bg-rose-500/10",
  BREAK_REMINDER: "text-amber-500 bg-amber-500/10",
  COMPLIANCE_WARNING: "text-orange-500 bg-orange-500/10",
  COMPLIANCE_ACHIEVED: "text-emerald-500 bg-emerald-500/10",
  BADGE_EARNED: "text-purple-500 bg-purple-500/10",
  XP_MILESTONE: "text-blue-500 bg-blue-500/10",
  STREAK_MILESTONE: "text-orange-500 bg-orange-500/10",
  TIMESHEET_APPROVED: "text-emerald-500 bg-emerald-500/10",
  TIMESHEET_REJECTED: "text-red-500 bg-red-500/10",
  TEAM_UPDATE: "text-blue-500 bg-blue-500/10",
  SCHEDULE_CHANGE: "text-violet-500 bg-violet-500/10",
  OVERTIME_WARNING: "text-amber-500 bg-amber-500/10",
  SYSTEM: "text-slate-500 bg-slate-500/10",
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  createdAt: Date
  isRead: boolean
  link?: string
  data?: Record<string, unknown>
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { unreadNotifications, markNotificationRead, markAllNotificationsRead, refresh } = useRealtime()

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts?limit=50")
      if (res.ok) {
        const data = await res.json()
        setNotifications(
          data.map((n: { id: string; type: string; title?: string; message: string; createdAt: string; isRead: boolean; link?: string; data?: Record<string, unknown> }) => ({
            ...n,
            title: n.title || getNotificationTitle(n.type),
            createdAt: new Date(n.createdAt),
          }))
        )
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-xl"
        >
          {unreadNotifications > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          <AnimatePresence>
            {unreadNotifications > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
              >
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">Notifications</SheetTitle>
            {notifications.some((n) => !n.isRead) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Bell className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <h3 className="font-semibold mb-1">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                You're all caught up! New notifications will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                  onClose={() => setIsOpen(false)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function NotificationItem({
  notification,
  onMarkRead,
  onClose,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  onClose: () => void
}) {
  const Icon = NOTIFICATION_ICONS[notification.type] || Bell
  const colorClass = NOTIFICATION_COLORS[notification.type] || "text-slate-500 bg-slate-500/10"

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer",
        !notification.isRead && "bg-primary/5"
      )}
      onClick={() => {
        if (!notification.isRead) {
          onMarkRead(notification.id)
        }
      }}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", colorClass)}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-medium", !notification.isRead && "text-foreground")}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1.5">
          {formatRelative(notification.createdAt)}
        </p>
      </div>

      {notification.link && (
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 my-auto" />
      )}
    </motion.div>
  )

  if (notification.link) {
    return (
      <Link href={notification.link} onClick={onClose}>
        {content}
      </Link>
    )
  }

  return content
}

function getNotificationTitle(type: string): string {
  const titles: Record<string, string> = {
    CLOCK_IN: "Clock In",
    CLOCK_OUT: "Clock Out",
    BREAK_REMINDER: "Break Reminder",
    COMPLIANCE_WARNING: "Compliance Alert",
    COMPLIANCE_ACHIEVED: "Goal Achieved",
    BADGE_EARNED: "Badge Earned",
    XP_MILESTONE: "XP Milestone",
    STREAK_MILESTONE: "Streak Milestone",
    TIMESHEET_APPROVED: "Timesheet Approved",
    TIMESHEET_REJECTED: "Timesheet Rejected",
    TEAM_UPDATE: "Team Update",
    SCHEDULE_CHANGE: "Schedule Change",
    OVERTIME_WARNING: "Overtime Warning",
    SYSTEM: "System Notification",
  }
  return titles[type] || "Notification"
}

// Toast notification component for real-time alerts
export function ToastNotification({
  notification,
  onDismiss,
}: {
  notification: { id: string; type: string; title: string; message: string }
  onDismiss: (id: string) => void
}) {
  const Icon = NOTIFICATION_ICONS[notification.type] || Bell
  const colorClass = NOTIFICATION_COLORS[notification.type] || "text-slate-500 bg-slate-500/10"

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id)
    }, 5000)
    return () => clearTimeout(timer)
  }, [notification.id, onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="pointer-events-auto w-full max-w-sm rounded-xl border border-border bg-card shadow-lg overflow-hidden"
    >
      <div className="flex gap-3 p-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{notification.title}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg flex-shrink-0"
          onClick={() => onDismiss(notification.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// Toast container for managing multiple toasts
export function ToastContainer() {
  const [toasts, setToasts] = useState<Array<{ id: string; type: string; title: string; message: string }>>([])
  const { subscribeToUpdates } = useRealtime()

  useEffect(() => {
    // Subscribe to realtime updates for live notifications
    const unsubscribe = subscribeToUpdates((state) => {
      // Check for new pending alerts and show as toasts
      if (state.pendingAlerts.length > 0) {
        const latestAlert = state.pendingAlerts[0]
        setToasts((prev) => {
          // Don't add duplicates
          if (prev.some((t) => t.id === latestAlert.id)) return prev
          return [
            ...prev,
            {
              id: latestAlert.id,
              type: latestAlert.type,
              title: getNotificationTitle(latestAlert.type),
              message: latestAlert.message,
            },
          ]
        })
      }
    })

    return unsubscribe
  }, [subscribeToUpdates])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastNotification
            key={toast.id}
            notification={toast}
            onDismiss={dismissToast}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
