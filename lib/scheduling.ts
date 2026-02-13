/**
 * Auto-scheduling algorithm using a greedy approach with fairness scoring.
 *
 * For each shift on each day of the week:
 *  1. Filter to employees who are available (not "unavailable")
 *  2. Score each candidate based on preference and fairness
 *  3. Assign the highest-scoring candidate
 */

import { addDays, format } from "date-fns"

interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  daysOfWeek: number[]
  color: string
}

interface Member {
  userId: string
  firstName: string | null
  lastName: string | null
}

interface Availability {
  userId: string
  dayOfWeek: number
  isAvailable: boolean
  preference: string
  startTime: string | null
  endTime: string | null
}

interface ExistingAssignment {
  shiftId: string
  userId: string
  endDate: string | null
}

interface ScheduleInput {
  weekStart: string
  shifts: Shift[]
  members: Member[]
  availability: Availability[]
  existingAssignments: ExistingAssignment[]
}

interface ScheduleEntry {
  shiftId: string
  shiftName: string
  userId: string
  userName: string
  date: string
  dayOfWeek: number
  startTime: string
  endTime: string
  color: string
  score: number
  reason: string
}

interface ScheduleResult {
  weekStart: string
  entries: ScheduleEntry[]
  unfilledSlots: Array<{ shiftId: string; shiftName: string; date: string; dayOfWeek: number; reason: string }>
  stats: {
    totalSlots: number
    filledSlots: number
    unfilledSlots: number
    memberAssignments: Record<string, number>
  }
}

export function generateSchedule(input: ScheduleInput): ScheduleResult {
  const { weekStart, shifts, members, availability, existingAssignments } = input
  const startDate = new Date(weekStart + "T00:00:00")

  // Build availability lookup: userId -> dayOfWeek -> availability
  const availMap = new Map<string, Map<number, Availability>>()
  for (const a of availability) {
    if (!availMap.has(a.userId)) availMap.set(a.userId, new Map())
    availMap.get(a.userId)!.set(a.dayOfWeek, a)
  }

  // Track existing assignment counts for fairness
  const existingCounts = new Map<string, number>()
  for (const ea of existingAssignments) {
    if (!ea.endDate) {
      existingCounts.set(ea.userId, (existingCounts.get(ea.userId) || 0) + 1)
    }
  }

  // Track new assignments for this schedule
  const newCounts = new Map<string, number>()
  // Track which users are assigned per day to avoid double-booking
  const dailyAssignments = new Map<string, Set<string>>() // date -> Set<userId>

  const entries: ScheduleEntry[] = []
  const unfilledSlots: ScheduleResult["unfilledSlots"] = []

  // For each day of the week (0=Sunday through 6=Saturday)
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = addDays(startDate, dayOffset)
    const dateStr = format(date, "yyyy-MM-dd")
    const dayOfWeek = date.getDay() // 0=Sun, 1=Mon, ...

    if (!dailyAssignments.has(dateStr)) {
      dailyAssignments.set(dateStr, new Set())
    }

    // For each shift that operates on this day
    for (const shift of shifts) {
      // Shift.daysOfWeek uses 1=Mon through 5=Fri (ISO convention)
      // Convert JS dayOfWeek (0=Sun) to ISO (1=Mon...7=Sun)
      const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek
      if (!shift.daysOfWeek.includes(isoDay)) continue

      // Find candidates
      const candidates: Array<{ userId: string; userName: string; score: number; reason: string }> = []

      for (const member of members) {
        // Skip if already assigned today
        if (dailyAssignments.get(dateStr)!.has(member.userId)) continue

        const avail = availMap.get(member.userId)?.get(dayOfWeek)
        const name = [member.firstName, member.lastName].filter(Boolean).join(" ") || "Employee"

        // If no availability set, treat as available (default)
        if (!avail) {
          const fairnessScore = getFairnessScore(member.userId, existingCounts, newCounts)
          candidates.push({
            userId: member.userId,
            userName: name,
            score: 50 + fairnessScore,
            reason: "No preference set",
          })
          continue
        }

        // Skip unavailable employees
        if (!avail.isAvailable || avail.preference === "unavailable") continue

        // Time window check
        if (avail.startTime && avail.endTime) {
          if (shift.startTime < avail.startTime || shift.endTime > avail.endTime) {
            continue // Shift falls outside their available window
          }
        }

        const preferenceScore = avail.preference === "preferred" ? 100 : 50
        const fairnessScore = getFairnessScore(member.userId, existingCounts, newCounts)

        candidates.push({
          userId: member.userId,
          userName: name,
          score: preferenceScore + fairnessScore,
          reason: avail.preference === "preferred" ? "Preferred slot" : "Available",
        })
      }

      if (candidates.length === 0) {
        unfilledSlots.push({
          shiftId: shift.id,
          shiftName: shift.name,
          date: dateStr,
          dayOfWeek,
          reason: "No available employees",
        })
        continue
      }

      // Sort by score descending, pick the best
      candidates.sort((a, b) => b.score - a.score)
      const best = candidates[0]

      entries.push({
        shiftId: shift.id,
        shiftName: shift.name,
        userId: best.userId,
        userName: best.userName,
        date: dateStr,
        dayOfWeek,
        startTime: shift.startTime,
        endTime: shift.endTime,
        color: shift.color || "#3b82f6",
        score: best.score,
        reason: best.reason,
      })

      newCounts.set(best.userId, (newCounts.get(best.userId) || 0) + 1)
      dailyAssignments.get(dateStr)!.add(best.userId)
    }
  }

  // Build member assignment counts for stats
  const memberAssignments: Record<string, number> = {}
  for (const entry of entries) {
    memberAssignments[entry.userName] = (memberAssignments[entry.userName] || 0) + 1
  }

  return {
    weekStart,
    entries,
    unfilledSlots,
    stats: {
      totalSlots: entries.length + unfilledSlots.length,
      filledSlots: entries.length,
      unfilledSlots: unfilledSlots.length,
      memberAssignments,
    },
  }
}

/**
 * Fairness score: employees with fewer assignments get higher scores.
 * Returns 0-40 bonus points based on inverse assignment count.
 */
function getFairnessScore(
  userId: string,
  existingCounts: Map<string, number>,
  newCounts: Map<string, number>
): number {
  const total = (existingCounts.get(userId) || 0) + (newCounts.get(userId) || 0)
  // Fewer assignments = higher score (max 40 at 0 assignments, decreasing)
  return Math.max(0, 40 - total * 5)
}
