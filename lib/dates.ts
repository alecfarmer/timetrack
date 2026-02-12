import { format, formatDistance, startOfWeek, endOfWeek, startOfDay, endOfDay, isWithinInterval, parseISO, differenceInMinutes } from "date-fns"
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz"

// Hardcoded fallback timezone if all else fails
const FALLBACK_TIMEZONE = "America/New_York"

// Parse date string ensuring UTC interpretation
function parseAsUTC(date: Date | string): Date {
  if (date instanceof Date) return date
  // If string doesn't have timezone info, treat as UTC
  if (typeof date === "string" && !date.endsWith("Z") && !date.includes("+") && !date.includes("-", 10)) {
    return parseISO(date + "Z")
  }
  return parseISO(date)
}

// Detect user's current timezone from browser (returns null if detection fails)
function detectBrowserTimezone(): string | null {
  if (typeof window !== "undefined") {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz) return tz
    } catch {
      // Detection failed
    }
  }
  return null
}

// Public wrapper that always returns a string
export function detectUserTimezone(): string {
  return detectBrowserTimezone() || FALLBACK_TIMEZONE
}

// Get the manual timezone override (without fallback)
export function getTimezoneOverride(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("timezone_override")
  }
  return null
}

export function getTimezone(): string {
  if (typeof window !== "undefined") {
    // 1. Manual override from settings
    const manualOverride = localStorage.getItem("timezone_override")
    if (manualOverride) {
      return manualOverride
    }
    // 2. Browser-detected timezone
    const browserTz = detectBrowserTimezone()
    if (browserTz) {
      return browserTz
    }
    // 3. Organization timezone (set by auth context on login)
    const orgTimezone = localStorage.getItem("org_timezone")
    if (orgTimezone) {
      return orgTimezone
    }
  }
  return FALLBACK_TIMEZONE
}

export function setTimezoneOverride(timezone: string | null): void {
  if (typeof window !== "undefined") {
    if (timezone) {
      localStorage.setItem("timezone_override", timezone)
    } else {
      localStorage.removeItem("timezone_override")
    }
  }
}

export function getDetectedTimezone(): string {
  return detectUserTimezone()
}

export function toLocalTime(date: Date | string, timezone?: string): Date {
  const tz = timezone || getTimezone()
  const d = parseAsUTC(date)
  return toZonedTime(d, tz)
}

export function toUTC(date: Date, timezone?: string): Date {
  const tz = timezone || getTimezone()
  return fromZonedTime(date, tz)
}

export function formatTime(date: Date | string, timezone?: string): string {
  const tz = timezone || getTimezone()
  const d = parseAsUTC(date)
  return formatInTimeZone(d, tz, "h:mm a")
}

export function formatTimeWithZone(date: Date | string, timezone?: string): string {
  const tz = timezone || getTimezone()
  const d = parseAsUTC(date)
  return formatInTimeZone(d, tz, "h:mm a zzz")
}

export function formatDateInZone(date: Date | string, fmt: string, timezone?: string): string {
  const tz = timezone || getTimezone()
  const d = parseAsUTC(date)
  return formatInTimeZone(d, tz, fmt)
}

export function formatDate(date: Date | string, timezone?: string): string {
  const tz = timezone || getTimezone()
  const d = parseAsUTC(date)
  return formatInTimeZone(d, tz, "MMM d, yyyy")
}

export function formatDateTime(date: Date | string, timezone?: string): string {
  const tz = timezone || getTimezone()
  const d = parseAsUTC(date)
  return formatInTimeZone(d, tz, "MMM d, yyyy h:mm a")
}

export function formatDayOfWeek(date: Date | string, timezone?: string): string {
  const tz = timezone || getTimezone()
  const d = parseAsUTC(date)
  return formatInTimeZone(d, tz, "EEEE")
}

export function formatShortDay(date: Date | string, timezone?: string): string {
  const tz = timezone || getTimezone()
  const d = parseAsUTC(date)
  return formatInTimeZone(d, tz, "EEE")
}

export function formatRelative(date: Date | string): string {
  const d = parseAsUTC(date)
  return formatDistance(d, new Date(), { addSuffix: true })
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) {
    return `${mins}m`
  }
  return `${hours}h ${mins}m`
}

export function formatTimer(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`
}

export function getWeekRange(date: Date, timezone?: string): { start: Date; end: Date } {
  const tz = timezone || getTimezone()
  const zonedDate = toZonedTime(date, tz)
  const start = startOfWeek(zonedDate, { weekStartsOn: 1 }) // Monday
  const end = endOfWeek(zonedDate, { weekStartsOn: 1 }) // Sunday
  return { start, end }
}

export function getDayRange(date: Date, timezone?: string): { start: Date; end: Date } {
  const tz = timezone || getTimezone()
  const zonedDate = toZonedTime(date, tz)
  return {
    start: startOfDay(zonedDate),
    end: endOfDay(zonedDate),
  }
}

export function isToday(date: Date | string, timezone?: string): boolean {
  const tz = timezone || getTimezone()
  const d = parseAsUTC(date)
  const zonedDate = toZonedTime(d, tz)
  const today = toZonedTime(new Date(), tz)
  return (
    zonedDate.getFullYear() === today.getFullYear() &&
    zonedDate.getMonth() === today.getMonth() &&
    zonedDate.getDate() === today.getDate()
  )
}

export function isSameDay(date1: Date, date2: Date, timezone?: string): boolean {
  const tz = timezone || getTimezone()
  const d1 = toZonedTime(date1, tz)
  const d2 = toZonedTime(date2, tz)
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

export function getMinutesBetween(start: Date, end: Date): number {
  return differenceInMinutes(end, start)
}

export function getWeekDays(date: Date, timezone?: string): Date[] {
  const { start } = getWeekRange(date, timezone)
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(start)
    day.setDate(day.getDate() + i)
    days.push(day)
  }
  return days
}
