"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react"
import { useAuth } from "./auth-context"

// XP rewards per action
const XP_REWARDS = {
  CLOCK_IN: 10,
  CLOCK_OUT: 5,
  FULL_DAY: 25, // 8+ hours
  EARLY_BIRD: 15, // Clock in before 7am
  NIGHT_OWL: 15, // Clock in after 8pm
  STREAK_DAY: 5, // Per day in streak
  STREAK_MILESTONE_7: 50,
  STREAK_MILESTONE_30: 200,
  STREAK_MILESTONE_100: 500,
  PER_HOUR_WORKED: 2, // Live accumulation
}

// Badge definitions
const BADGES = {
  EARLY_BIRD: { id: "early_bird", name: "Early Bird", emoji: "🐦", description: "Clock in before 7am" },
  NIGHT_OWL: { id: "night_owl", name: "Night Owl", emoji: "🦉", description: "Clock in after 8pm" },
  STREAK_7: { id: "streak_7", name: "Week Warrior", emoji: "🔥", description: "7-day streak" },
  STREAK_30: { id: "streak_30", name: "Monthly Master", emoji: "💯", description: "30-day streak" },
  CENTURY: { id: "century", name: "Century Club", emoji: "💯", description: "100 clock-ins" },
  PERFECT_WEEK: { id: "perfect_week", name: "Perfect Week", emoji: "⭐", description: "5 full days in a week" },
  IRON_WILL: { id: "iron_will", name: "Iron Will", emoji: "💪", description: "No missed days in a month" },
}

interface RealtimeState {
  // Clock state
  isClockedIn: boolean
  clockInTime: Date | null
  currentSessionMinutes: number
  totalMinutesToday: number
  isOnBreak: boolean
  breakStartTime: Date | null

  // XP & Rewards
  totalXP: number
  currentLevel: number
  xpToNextLevel: number
  sessionXP: number // XP earned this session (live)
  recentBadges: string[]
  currentStreak: number

  // Week summary
  daysWorked: number
  requiredDays: number
  weeklyMinutes: number
  isCompliant: boolean

  // Activity
  lastActivity: { type: string; timestamp: Date; description: string } | null

  // Notifications
  unreadNotifications: number
  pendingAlerts: Array<{ id: string; type: string; message: string; createdAt: Date }>
}

interface RealtimeContextValue extends RealtimeState {
  // Actions
  refresh: () => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>

  // Real-time subscriptions
  subscribeToUpdates: (callback: (state: RealtimeState) => void) => () => void
}

const defaultState: RealtimeState = {
  isClockedIn: false,
  clockInTime: null,
  currentSessionMinutes: 0,
  totalMinutesToday: 0,
  isOnBreak: false,
  breakStartTime: null,
  totalXP: 0,
  currentLevel: 1,
  xpToNextLevel: 100,
  sessionXP: 0,
  recentBadges: [],
  currentStreak: 0,
  daysWorked: 0,
  requiredDays: 3,
  weeklyMinutes: 0,
  isCompliant: false,
  lastActivity: null,
  unreadNotifications: 0,
  pendingAlerts: [],
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

// Calculate level from XP (exponential curve)
function calculateLevel(xp: number): { level: number; xpToNext: number } {
  // Level thresholds: 100, 250, 500, 1000, 2000, 4000, 8000...
  const baseXP = 100
  let level = 1
  let xpNeeded = baseXP
  let totalXpForLevel = 0

  while (xp >= totalXpForLevel + xpNeeded) {
    totalXpForLevel += xpNeeded
    level++
    xpNeeded = Math.floor(baseXP * Math.pow(1.5, level - 1))
  }

  const xpInCurrentLevel = xp - totalXpForLevel
  const xpToNext = xpNeeded - xpInCurrentLevel

  return { level, xpToNext }
}

// Calculate session XP based on minutes worked
function calculateSessionXP(minutes: number): number {
  const hours = minutes / 60
  return Math.floor(hours * XP_REWARDS.PER_HOUR_WORKED)
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<RealtimeState>(defaultState)
  const subscribersRef = useRef<Set<(state: RealtimeState) => void>>(new Set())
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // Notify all subscribers when state changes
  const notifySubscribers = useCallback((newState: RealtimeState) => {
    subscribersRef.current.forEach((callback) => callback(newState))
  }, [])

  // Fetch all realtime data from server
  const fetchRealtimeData = useCallback(async () => {
    if (!user) return

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const headers = { "x-timezone": tz }

      // Fetch dashboard data, streaks, and notifications in parallel
      const [dashboardRes, streaksRes, alertsRes] = await Promise.all([
        fetch("/api/dashboard", { headers }),
        fetch("/api/streaks", { headers }),
        fetch("/api/alerts?unreadOnly=true&limit=10", { headers }),
      ])

      const dashboard = dashboardRes.ok ? await dashboardRes.json() : null
      const streaks = streaksRes.ok ? await streaksRes.json() : null
      const alertsData = alertsRes.ok ? await alertsRes.json() : null

      if (!dashboard) return

      const isClockedIn = dashboard.currentStatus?.isClockedIn || false
      const clockInTime = dashboard.currentStatus?.currentSessionStart
        ? new Date(dashboard.currentStatus.currentSessionStart)
        : null

      // Calculate current session minutes
      let currentSessionMinutes = 0
      if (isClockedIn && clockInTime) {
        currentSessionMinutes = Math.floor((Date.now() - clockInTime.getTime()) / 60000)
      }

      const totalXP = streaks?.xp || 0
      const { level, xpToNext } = calculateLevel(totalXP)
      const sessionXP = calculateSessionXP(currentSessionMinutes)

      // Extract notifications array from alerts response
      const notifications = alertsData?.notifications || []

      const newState: RealtimeState = {
        isClockedIn,
        clockInTime,
        currentSessionMinutes,
        totalMinutesToday: dashboard.currentStatus?.totalMinutesToday || 0,
        isOnBreak: dashboard.currentStatus?.isOnBreak || false,
        breakStartTime: dashboard.currentStatus?.breakStartTime
          ? new Date(dashboard.currentStatus.breakStartTime)
          : null,
        totalXP,
        currentLevel: level,
        xpToNextLevel: xpToNext,
        sessionXP,
        recentBadges: streaks?.recentBadges || [],
        currentStreak: streaks?.currentStreak || 0,
        daysWorked: dashboard.weekSummary?.daysWorked || 0,
        requiredDays: dashboard.weekSummary?.requiredDays || 3,
        weeklyMinutes: dashboard.weekSummary?.totalMinutes || 0,
        isCompliant: dashboard.weekSummary?.isCompliant || false,
        lastActivity: dashboard.currentStatus?.todayEntries?.[0]
          ? {
              type: dashboard.currentStatus.todayEntries[0].type,
              timestamp: new Date(dashboard.currentStatus.todayEntries[0].timestampServer),
              description: `${dashboard.currentStatus.todayEntries[0].type === "CLOCK_IN" ? "Clocked in" : "Clocked out"} at ${dashboard.currentStatus.todayEntries[0].location?.name || "Unknown"}`,
            }
          : null,
        unreadNotifications: alertsData?.unreadCount || 0,
        pendingAlerts: notifications.map((a: { id: string; type: string; message: string; createdAt: string }) => ({
          id: a.id,
          type: a.type,
          message: a.message,
          createdAt: new Date(a.createdAt),
        })),
      }

      setState(newState)
      notifySubscribers(newState)
    } catch (error) {
      console.error("Failed to fetch realtime data:", error)
    }
  }, [user, notifySubscribers])

  // Update session time every second when clocked in
  useEffect(() => {
    if (state.isClockedIn && state.clockInTime) {
      timerRef.current = setInterval(() => {
        setState((prev) => {
          if (!prev.clockInTime) return prev

          const currentSessionMinutes = Math.floor(
            (Date.now() - prev.clockInTime.getTime()) / 60000
          )
          const sessionXP = calculateSessionXP(currentSessionMinutes)
          const totalXP = prev.totalXP + sessionXP - prev.sessionXP
          const { level, xpToNext } = calculateLevel(totalXP)

          const newState = {
            ...prev,
            currentSessionMinutes,
            sessionXP,
            totalXP,
            currentLevel: level,
            xpToNextLevel: xpToNext,
          }

          notifySubscribers(newState)
          return newState
        })
      }, 1000) // Update every second for smooth timer
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [state.isClockedIn, state.clockInTime, notifySubscribers])

  // Poll for updates every 30 seconds
  useEffect(() => {
    if (!user) return

    // Initial fetch
    fetchRealtimeData()

    // Set up polling
    pollRef.current = setInterval(fetchRealtimeData, 30000)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [user, fetchRealtimeData])

  // Mark notification as read
  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      setState((prev) => ({
        ...prev,
        unreadNotifications: Math.max(0, prev.unreadNotifications - 1),
        pendingAlerts: prev.pendingAlerts.filter((a) => a.id !== id),
      }))
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }, [])

  // Mark all notifications as read
  const markAllNotificationsRead = useCallback(async () => {
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      })

      setState((prev) => ({
        ...prev,
        unreadNotifications: 0,
        pendingAlerts: [],
      }))
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }, [])

  // Subscribe to state updates
  const subscribeToUpdates = useCallback(
    (callback: (state: RealtimeState) => void) => {
      subscribersRef.current.add(callback)
      return () => {
        subscribersRef.current.delete(callback)
      }
    },
    []
  )

  const value: RealtimeContextValue = {
    ...state,
    refresh: fetchRealtimeData,
    markNotificationRead,
    markAllNotificationsRead,
    subscribeToUpdates,
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error("useRealtime must be used within a RealtimeProvider")
  }
  return context
}

// Hook for live XP display with animation support
export function useLiveXP() {
  const { totalXP, sessionXP, currentLevel, xpToNextLevel } = useRealtime()

  return {
    totalXP,
    sessionXP,
    level: currentLevel,
    xpToNext: xpToNextLevel,
    xpProgress: Math.max(0, 100 - (xpToNextLevel / (totalXP + xpToNextLevel)) * 100),
  }
}

// Hook for live timer display
export function useLiveTimer() {
  const { isClockedIn, clockInTime, currentSessionMinutes, isOnBreak, breakStartTime } = useRealtime()

  const formatTimer = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    const s = Math.floor((Date.now() - (clockInTime?.getTime() || 0)) / 1000) % 60
    return { hours: h, minutes: m, seconds: s }
  }

  return {
    isClockedIn,
    isOnBreak,
    clockInTime,
    breakStartTime,
    sessionMinutes: currentSessionMinutes,
    timer: formatTimer(currentSessionMinutes),
  }
}

// Hook for live compliance tracking
export function useLiveCompliance() {
  const { daysWorked, requiredDays, weeklyMinutes, isCompliant, currentStreak } = useRealtime()

  return {
    daysWorked,
    requiredDays,
    weeklyMinutes,
    weeklyHours: Math.floor(weeklyMinutes / 60),
    isCompliant,
    compliancePercent: Math.min(100, (daysWorked / requiredDays) * 100),
    currentStreak,
  }
}
