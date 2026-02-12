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
import { getTimezone } from "@/lib/dates"

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
  xpProgress: number // percentage 0-100
  sessionXP: number // XP earned this session (live)
  recentBadges: Array<{ id: string; name: string; icon: string }>
  currentStreak: number
  longestStreak: number
  streakShields: number
  xpMultiplier: number
  coins: number
  activeTitle: string | null
  unclaimedRewards: number

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
  xpProgress: 0,
  sessionXP: 0,
  recentBadges: [],
  currentStreak: 0,
  longestStreak: 0,
  streakShields: 0,
  xpMultiplier: 1.0,
  coins: 0,
  activeTitle: null,
  unclaimedRewards: 0,
  daysWorked: 0,
  requiredDays: 3,
  weeklyMinutes: 0,
  isCompliant: false,
  lastActivity: null,
  unreadNotifications: 0,
  pendingAlerts: [],
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<RealtimeState>(defaultState)
  const subscribersRef = useRef<Set<(state: RealtimeState) => void>>(new Set())
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // Notify all subscribers when state changes
  const notifySubscribers = useCallback((newState: RealtimeState) => {
    subscribersRef.current.forEach((callback) => callback(newState))
  }, [])

  // Fetch all realtime data from server
  const fetchRealtimeData = useCallback(async () => {
    if (!user) return

    try {
      const headers = { "x-timezone": getTimezone() }

      // Fetch dashboard data, rewards profile, and notifications in parallel
      const [dashboardRes, rewardsRes, alertsRes] = await Promise.all([
        fetch("/api/dashboard", { headers }),
        fetch("/api/rewards/profile", { headers }),
        fetch("/api/alerts?unreadOnly=true&limit=10", { headers }),
      ])

      const dashboard = dashboardRes.ok ? await dashboardRes.json() : null
      const rewards = rewardsRes.ok ? await rewardsRes.json() : null
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

      const profile = rewards?.profile
      const totalXP = profile?.totalXp || 0
      const level = profile?.level || 1
      const levelProgress = rewards?.levelProgress
      const sessionXP = Math.floor((currentSessionMinutes / 60) * 2)

      // Extract notifications array from alerts response
      const notifications = alertsData?.notifications || []

      // Map recent earned badges for display
      const earnedBadges = rewards?.earnedBadges || []
      const recentBadges = earnedBadges
        .slice(0, 5)
        .map((b: { badgeDefinitionId: string; badge?: { name: string; icon: string } }) => ({
          id: b.badgeDefinitionId,
          name: b.badge?.name || "",
          icon: b.badge?.icon || "🏆",
        }))

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
        xpToNextLevel: levelProgress?.xpNeeded || 100,
        xpProgress: levelProgress?.progressPercent || 0,
        sessionXP,
        recentBadges,
        currentStreak: profile?.currentStreak || 0,
        longestStreak: profile?.longestStreak || 0,
        streakShields: profile?.streakShields || 0,
        xpMultiplier: profile?.xpMultiplier || 1.0,
        coins: profile?.coins || 0,
        activeTitle: rewards?.activeTitle?.name || null,
        unclaimedRewards: rewards?.unclaimedCount || 0,
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

  // Poll for updates every 60 seconds
  useEffect(() => {
    if (!user) return

    // Initial fetch
    fetchRealtimeData()

    // Set up polling
    pollRef.current = setInterval(fetchRealtimeData, 60000)

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

const noopRealtimeValue: RealtimeContextValue = {
  ...defaultState,
  refresh: async () => {},
  markNotificationRead: async () => {},
  markAllNotificationsRead: async () => {},
  subscribeToUpdates: () => () => {},
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  return context ?? noopRealtimeValue
}

// Hook for live XP display with animation support
export function useLiveXP() {
  const { totalXP, sessionXP, currentLevel, xpToNextLevel, xpProgress, coins, streakShields, xpMultiplier, activeTitle } = useRealtime()

  return {
    totalXP,
    sessionXP,
    level: currentLevel,
    xpToNext: xpToNextLevel,
    xpProgress,
    coins,
    streakShields,
    xpMultiplier,
    activeTitle,
  }
}

// Hook for live timer display — reads session minutes from context state
export function useLiveTimer() {
  const { isClockedIn, clockInTime, currentSessionMinutes, isOnBreak, breakStartTime } = useRealtime()

  const formatTimer = useCallback((minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return { hours: h, minutes: m, seconds: 0 }
  }, [])

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
