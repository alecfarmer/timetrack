"use client"

import { useEffect } from "react"
import {
  checkClockInReminder,
  checkForgotClockOutReminder,
  checkComplianceReminder,
  requestNotificationPermission,
} from "@/lib/notifications"

interface NotificationState {
  isClockedIn: boolean
  currentSessionStart: string | null
  daysWorked: number
  requiredDays: number
}

/**
 * Manages browser notification permission and reminder checks.
 * Requests permission on mount, then checks reminders when state changes.
 */
export function useNotifications(state: NotificationState | null) {
  // Request notification permission on first load
  useEffect(() => {
    requestNotificationPermission()
  }, [])

  // Run notification checks when status changes
  useEffect(() => {
    if (!state) return
    checkClockInReminder(state.isClockedIn)
    checkForgotClockOutReminder(
      state.isClockedIn,
      state.currentSessionStart ? new Date(state.currentSessionStart) : null
    )
    checkComplianceReminder(state.daysWorked, state.requiredDays)
  }, [state])
}
