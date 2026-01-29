// Client-side notification and reminder system

const REMINDER_KEY = "onsite-reminder-settings"
const LAST_CHECKIN_REMINDER = "onsite-last-checkin-reminder"
const LAST_CHECKOUT_REMINDER = "onsite-last-checkout-reminder"
const LAST_COMPLIANCE_REMINDER = "onsite-last-compliance-reminder"

export interface ReminderSettings {
  clockInReminder: boolean
  clockInTime: string // HH:mm format
  forgotClockOutReminder: boolean
  forgotClockOutAfterHours: number
  weeklyComplianceReminder: boolean
  complianceReminderDay: number // 0=Sun, 1=Mon, ..., 4=Thu, 5=Fri
}

const DEFAULT_SETTINGS: ReminderSettings = {
  clockInReminder: true,
  clockInTime: "09:00",
  forgotClockOutReminder: true,
  forgotClockOutAfterHours: 10,
  weeklyComplianceReminder: true,
  complianceReminderDay: 4, // Thursday
}

export function getReminderSettings(): ReminderSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const stored = localStorage.getItem(REMINDER_KEY)
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {}
  return DEFAULT_SETTINGS
}

export function saveReminderSettings(settings: ReminderSettings): void {
  if (typeof window === "undefined") return
  localStorage.setItem(REMINDER_KEY, JSON.stringify(settings))
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false
  if (Notification.permission === "granted") return true
  if (Notification.permission === "denied") return false
  const result = await Notification.requestPermission()
  return result === "granted"
}

export function canNotify(): boolean {
  return typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted"
}

export function sendNotification(title: string, body: string, tag?: string): void {
  if (!canNotify()) return
  try {
    new Notification(title, {
      body,
      icon: "/favicon.svg",
      tag: tag || "onsite-notification",
      badge: "/favicon.svg",
    })
  } catch {
    // Notification API may fail silently in some contexts
  }
}

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

// Check if we should send a clock-in reminder
export function checkClockInReminder(isClockedIn: boolean): void {
  const settings = getReminderSettings()
  if (!settings.clockInReminder || !canNotify()) return

  const now = new Date()
  const dayOfWeek = now.getDay()
  // Only weekdays
  if (dayOfWeek === 0 || dayOfWeek === 6) return

  const [hours, minutes] = settings.clockInTime.split(":").map(Number)
  const reminderTime = new Date(now)
  reminderTime.setHours(hours, minutes, 0, 0)

  // Only remind after the configured time and if not already clocked in
  if (now < reminderTime || isClockedIn) return

  const lastReminder = localStorage.getItem(LAST_CHECKIN_REMINDER)
  const todayKey = getDateKey(now)
  if (lastReminder === todayKey) return

  localStorage.setItem(LAST_CHECKIN_REMINDER, todayKey)
  sendNotification(
    "Clock In Reminder",
    "You haven't clocked in today. Don't forget to start tracking your time!",
    "clock-in-reminder"
  )
}

// Check if the user might have forgotten to clock out
export function checkForgotClockOutReminder(isClockedIn: boolean, clockInTime: Date | null): void {
  const settings = getReminderSettings()
  if (!settings.forgotClockOutReminder || !canNotify() || !isClockedIn || !clockInTime) return

  const now = new Date()
  const hoursWorked = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)

  if (hoursWorked < settings.forgotClockOutAfterHours) return

  const lastReminder = localStorage.getItem(LAST_CHECKOUT_REMINDER)
  const todayKey = getDateKey(now)
  if (lastReminder === todayKey) return

  localStorage.setItem(LAST_CHECKOUT_REMINDER, todayKey)
  sendNotification(
    "Still Clocked In?",
    `You've been clocked in for ${Math.floor(hoursWorked)} hours. Did you forget to clock out?`,
    "clock-out-reminder"
  )
}

// Check weekly compliance reminder
export function checkComplianceReminder(daysWorked: number, requiredDays: number): void {
  const settings = getReminderSettings()
  if (!settings.weeklyComplianceReminder || !canNotify()) return

  const now = new Date()
  if (now.getDay() !== settings.complianceReminderDay) return

  const lastReminder = localStorage.getItem(LAST_COMPLIANCE_REMINDER)
  const todayKey = getDateKey(now)
  if (lastReminder === todayKey) return

  const remaining = requiredDays - daysWorked
  if (remaining <= 0) return

  localStorage.setItem(LAST_COMPLIANCE_REMINDER, todayKey)
  sendNotification(
    "Weekly Compliance",
    `You need ${remaining} more on-site day${remaining > 1 ? "s" : ""} this week to meet compliance.`,
    "compliance-reminder"
  )
}
