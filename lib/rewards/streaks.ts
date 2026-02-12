import { supabaseAdmin } from "@/lib/supabase"
import { grantXp } from "./xp"
import { logRewardsActivity } from "./activity"
import { format, subDays } from "date-fns"
import { toZonedTime } from "date-fns-tz"

export interface StreakUpdateResult {
  currentStreak: number
  streakContinued: boolean
  streakBroken: boolean
  shieldUsed: boolean
  xpMultiplier: number
  milestoneReached: number | null
}

const STREAK_MILESTONES = [3, 5, 7, 10, 15, 20, 30, 50, 75, 100]
const STREAK_MILESTONE_XP: Record<number, number> = {
  3: 10,
  5: 25,
  7: 50,
  10: 100,
  15: 150,
  20: 250,
  30: 400,
  50: 600,
  75: 800,
  100: 1000,
}

/**
 * Update streak for a user after a clock-in event.
 * Continues, breaks, or shields the streak. Updates RewardsProfile + StreakHistory.
 * Multiplier formula: 1.0 + min(currentStreak * 0.02, 0.50) → capped at 1.5x
 */
export async function updateStreak(
  userId: string,
  orgId: string,
  timezone: string
): Promise<StreakUpdateResult> {
  const { data: profile } = await supabaseAdmin
    .from("RewardsProfile")
    .select("*")
    .eq("userId", userId)
    .eq("orgId", orgId)
    .single()

  if (!profile) {
    return {
      currentStreak: 1,
      streakContinued: true,
      streakBroken: false,
      shieldUsed: false,
      xpMultiplier: 1.02,
      milestoneReached: null,
    }
  }

  const now = new Date()
  const zonedNow = toZonedTime(now, timezone)
  const todayStr = format(zonedNow, "yyyy-MM-dd")

  // Already updated streak today
  if (profile.lastStreakDate === todayStr) {
    return {
      currentStreak: profile.currentStreak,
      streakContinued: false,
      streakBroken: false,
      shieldUsed: false,
      xpMultiplier: Number(profile.xpMultiplier),
      milestoneReached: null,
    }
  }

  const lastDate = profile.lastStreakDate
  let streakContinued = false
  let streakBroken = false
  let shieldUsed = false
  let newStreak = profile.currentStreak

  if (!lastDate) {
    // First ever streak day
    newStreak = 1
    streakContinued = true
  } else {
    // Check if the streak continues
    const expectedDates = getExpectedWorkdays(lastDate, todayStr, timezone)

    if (expectedDates.length === 0) {
      // Today is the next expected workday — streak continues
      newStreak = profile.currentStreak + 1
      streakContinued = true
    } else {
      // There are missed workdays between last date and today
      const missedDays = expectedDates.length

      if (missedDays <= profile.streakShields) {
        // Use shields to cover missed days
        shieldUsed = true
        newStreak = profile.currentStreak + 1 // Continue streak

        await supabaseAdmin
          .from("RewardsProfile")
          .update({
            streakShields: profile.streakShields - missedDays,
          })
          .eq("id", profile.id)

        // Update StreakHistory shields count
        await supabaseAdmin
          .from("StreakHistory")
          .update({
            shieldsUsed: (profile.currentStreak > 0 ? missedDays : 0),
          })
          .eq("userId", userId)
          .eq("orgId", orgId)
          .is("endDate", null)
      } else {
        // Streak broken — close old streak, start new one
        const previousStreak = profile.currentStreak

        // Close existing StreakHistory
        if (previousStreak > 0) {
          await supabaseAdmin
            .from("StreakHistory")
            .update({
              endDate: lastDate,
              length: previousStreak,
            })
            .eq("userId", userId)
            .eq("orgId", orgId)
            .is("endDate", null)
        }

        newStreak = 1
        streakBroken = true
      }
    }
  }

  // Calculate new multiplier
  const newMultiplier = 1.0 + Math.min(newStreak * 0.02, 0.50)

  // Check for milestone
  let milestoneReached: number | null = null
  for (const milestone of STREAK_MILESTONES) {
    if (newStreak === milestone && profile.currentStreak < milestone) {
      milestoneReached = milestone
      break
    }
  }

  // Update profile
  const updateData: Record<string, unknown> = {
    currentStreak: newStreak,
    lastStreakDate: todayStr,
    xpMultiplier: newMultiplier,
    updatedAt: new Date().toISOString(),
  }

  if (newStreak > profile.longestStreak) {
    updateData.longestStreak = newStreak
  }

  await supabaseAdmin
    .from("RewardsProfile")
    .update(updateData)
    .eq("id", profile.id)

  // Create new StreakHistory if starting fresh
  if (streakBroken || (!lastDate && streakContinued)) {
    await supabaseAdmin.from("StreakHistory").insert({
      userId,
      orgId,
      startDate: todayStr,
      length: 1,
      peakMultiplier: newMultiplier,
    })
  } else if (streakContinued || shieldUsed) {
    // Update existing StreakHistory
    await supabaseAdmin
      .from("StreakHistory")
      .update({
        length: newStreak,
        peakMultiplier: newMultiplier,
      })
      .eq("userId", userId)
      .eq("orgId", orgId)
      .is("endDate", null)
  }

  // Grant streak bonus XP
  if (streakContinued || shieldUsed) {
    const streakXp = 5 + Math.min(newStreak, 25) // 5-30 XP per streak day
    await grantXp(userId, orgId, streakXp, "STREAK_BONUS", {
      sourceType: "streak",
      metadata: { streakDay: newStreak },
      skipMultiplier: true,
    })
  }

  // Grant milestone XP
  if (milestoneReached) {
    const milestoneXp = STREAK_MILESTONE_XP[milestoneReached] || 0
    if (milestoneXp > 0) {
      await grantXp(userId, orgId, milestoneXp, "STREAK_BONUS", {
        sourceType: "streak_milestone",
        metadata: { milestone: milestoneReached },
        skipMultiplier: true,
      })
    }

    await logRewardsActivity(
      orgId,
      userId,
      "streak_milestone",
      `Reached a ${milestoneReached}-day streak!`,
      { milestone: milestoneReached, streak: newStreak }
    )
  }

  return {
    currentStreak: newStreak,
    streakContinued,
    streakBroken,
    shieldUsed,
    xpMultiplier: newMultiplier,
    milestoneReached,
  }
}

/**
 * Get workdays that should have been worked between two dates (exclusive of both).
 * Returns empty array if today is the next expected workday.
 */
function getExpectedWorkdays(lastDateStr: string, todayStr: string, timezone: string): string[] {
  const lastDate = new Date(lastDateStr)
  const today = new Date(todayStr)
  const missed: string[] = []

  let check = new Date(lastDate)
  check.setDate(check.getDate() + 1)

  while (format(check, "yyyy-MM-dd") < todayStr) {
    const dow = check.getDay()
    // Skip weekends
    if (dow !== 0 && dow !== 6) {
      missed.push(format(check, "yyyy-MM-dd"))
    }
    check.setDate(check.getDate() + 1)
  }

  return missed
}
