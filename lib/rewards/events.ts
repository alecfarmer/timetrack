import { supabaseAdmin } from "@/lib/supabase"
import { grantXp, ensureProfile, type XpGrantResult } from "./xp"
import { updateStreak, type StreakUpdateResult } from "./streaks"
import { evaluateBadges, type BadgeEvalResult } from "./badges"
import { generateChallenges, updateChallengeProgress } from "./challenges"
import { logRewardsActivity } from "./activity"
import { getLevelForXp } from "./levels"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, getHours } from "date-fns"
import { toZonedTime } from "date-fns-tz"

export interface RewardsEventResult {
  xp: XpGrantResult | null
  streak: StreakUpdateResult | null
  badges: BadgeEvalResult[]
  challengeUpdates: Array<{ challengeId: string; name: string; completed: boolean; progress: number; target: number }>
  dailyBonus: boolean
  leveledUp: boolean
  newLevel: number | null
}

/**
 * Main orchestrator called after entry creation.
 * Grants base XP, updates streak, evaluates badges, updates challenges.
 * Returns all events for client-side celebration modals.
 */
export async function processRewardsEvent(
  userId: string,
  orgId: string,
  entryType: string,
  entry: Record<string, unknown>,
  timezone: string
): Promise<RewardsEventResult> {
  const result: RewardsEventResult = {
    xp: null,
    streak: null,
    badges: [],
    challengeUpdates: [],
    dailyBonus: false,
    leveledUp: false,
    newLevel: null,
  }

  try {
    // Ensure profile exists
    await ensureProfile(userId, orgId)

    // 1. Grant base XP for the entry type
    const baseXp = getBaseXp(entryType)
    if (baseXp > 0) {
      // 10% chance of daily bonus (variable ratio reinforcement)
      const dailyBonus = entryType === "CLOCK_IN" && Math.random() < 0.10
      const xpAmount = dailyBonus ? baseXp * 2 : baseXp

      result.xp = await grantXp(userId, orgId, xpAmount, "CLOCK_IN", {
        sourceType: "entry",
        sourceId: entry.id as string,
        metadata: dailyBonus ? { dailyBonus: true } : undefined,
      })

      result.dailyBonus = dailyBonus

      if (result.xp.leveledUp) {
        result.leveledUp = true
        result.newLevel = result.xp.newLevel

        await logRewardsActivity(orgId, userId, "level_up", `Reached Level ${result.xp.newLevel}!`, {
          level: result.xp.newLevel,
          totalXp: result.xp.newTotal,
        })
      }
    }

    // 2. Update streak (only on CLOCK_IN)
    if (entryType === "CLOCK_IN") {
      result.streak = await updateStreak(userId, orgId, timezone)
    }

    // 3. Evaluate badges
    const stats = await getUserStats(userId, orgId, timezone)
    result.badges = await evaluateBadges(userId, orgId, stats)

    // 4. Update challenge progress
    const eventData: Record<string, unknown> = {
      entryType,
      currentStreak: result.streak?.currentStreak || 0,
    }
    result.challengeUpdates = await updateChallengeProgress(userId, orgId, entryType, eventData)

    // 5. Generate new challenges if needed (on CLOCK_IN only, to avoid overhead)
    if (entryType === "CLOCK_IN") {
      const { data: profile } = await supabaseAdmin
        .from("RewardsProfile")
        .select("level")
        .eq("userId", userId)
        .eq("orgId", orgId)
        .single()

      if (profile) {
        await generateChallenges(userId, orgId, profile.level, timezone)
      }
    }
  } catch (err) {
    // Rewards processing is non-critical — log and continue
    console.error("Rewards event processing error:", err)
  }

  return result
}

function getBaseXp(entryType: string): number {
  switch (entryType) {
    case "CLOCK_IN":
      return 10
    case "CLOCK_OUT":
      return 5
    case "BREAK_START":
      return 2
    case "BREAK_END":
      return 2
    default:
      return 0
  }
}

/**
 * Gather user stats for badge evaluation.
 */
async function getUserStats(userId: string, orgId: string, timezone: string) {
  const now = new Date()
  const zonedNow = toZonedTime(now, timezone)

  const [workDaysResult, kudosGivenResult, kudosReceivedResult, challengesResult, shieldsResult, hiddenResult, streakHistoryResult] = await Promise.all([
    supabaseAdmin
      .from("WorkDay")
      .select("date, totalMinutes, firstClockIn, lastClockOut, breakMinutes, location:Location(category)")
      .eq("userId", userId)
      .order("date", { ascending: false }),

    supabaseAdmin
      .from("Kudos")
      .select("id", { count: "exact", head: true })
      .eq("fromUserId", userId)
      .eq("orgId", orgId),

    supabaseAdmin
      .from("Kudos")
      .select("id", { count: "exact", head: true })
      .eq("toUserId", userId)
      .eq("orgId", orgId),

    supabaseAdmin
      .from("ActiveChallenge")
      .select("id", { count: "exact", head: true })
      .eq("userId", userId)
      .eq("orgId", orgId)
      .in("status", ["claimed"]),

    supabaseAdmin
      .from("StreakHistory")
      .select("shieldsUsed")
      .eq("userId", userId)
      .eq("orgId", orgId),

    supabaseAdmin
      .from("EarnedBadge")
      .select("badgeDefinitionId")
      .eq("userId", userId)
      .eq("orgId", orgId),

    supabaseAdmin
      .from("StreakHistory")
      .select("length, endDate")
      .eq("userId", userId)
      .eq("orgId", orgId),
  ])

  const allWorkDays = workDaysResult.data || []
  const filterOnsite = (days: typeof allWorkDays) =>
    days.filter((wd) => {
      const loc = Array.isArray(wd.location) ? wd.location[0] : wd.location
      return loc?.category !== "HOME"
    })

  const onsiteDays = filterOnsite(allWorkDays)
  const monthStart = format(startOfMonth(zonedNow), "yyyy-MM-dd")
  const monthEnd = format(endOfMonth(zonedNow), "yyyy-MM-dd")

  // Perfect weeks count
  const weekMap = new Map<string, number>()
  for (const wd of onsiteDays) {
    const d = new Date(wd.date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.getFullYear(), d.getMonth(), diff)
    const weekKey = format(monday, "yyyy-MM-dd")
    weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1)
  }
  const perfectWeeks = [...weekMap.values()].filter((count) => count >= 3).length

  // Profile for streak info
  const { data: profile } = await supabaseAdmin
    .from("RewardsProfile")
    .select("currentStreak, longestStreak, xpMultiplier, streakShields")
    .eq("userId", userId)
    .eq("orgId", orgId)
    .single()

  const totalShieldsUsed = (shieldsResult.data || []).reduce(
    (sum, s) => sum + (s.shieldsUsed || 0),
    0
  )

  // Count hidden badges earned
  let hiddenBadgesFound = 0
  if (hiddenResult.data && hiddenResult.data.length > 0) {
    const badgeIds = hiddenResult.data.map((eb) => eb.badgeDefinitionId)
    const { count } = await supabaseAdmin
      .from("BadgeDefinition")
      .select("id", { count: "exact", head: true })
      .in("id", badgeIds)
      .eq("isHidden", true)
    hiddenBadgesFound = count || 0
  }

  // Compute streak history stats
  const allStreakHistories = streakHistoryResult.data || []
  const completedStreakLengths = allStreakHistories
    .filter((s) => s.endDate !== null)
    .map((s) => s.length || 0)
  const totalStreakDays = allStreakHistories.reduce((sum, s) => sum + (s.length || 0), 0)

  return {
    totalOnsiteDays: onsiteDays.length,
    totalHours: Math.round(allWorkDays.reduce((sum, wd) => sum + (wd.totalMinutes || 0), 0) / 60),
    currentStreak: profile?.currentStreak || 0,
    longestStreak: profile?.longestStreak || 0,
    perfectWeeks,
    thisMonthDays: onsiteDays.filter((d) => d.date >= monthStart && d.date <= monthEnd).length,
    earlyBirdCount: allWorkDays.filter((wd) => wd.firstClockIn && getHours(toZonedTime(new Date(wd.firstClockIn), timezone)) < 8).length,
    dawnPatrolCount: allWorkDays.filter((wd) => wd.firstClockIn && getHours(toZonedTime(new Date(wd.firstClockIn), timezone)) < 7).length,
    nightOwlCount: allWorkDays.filter((wd) => wd.lastClockOut && getHours(toZonedTime(new Date(wd.lastClockOut), timezone)) >= 19).length,
    onTimeCount: allWorkDays.filter((wd) => {
      if (!wd.firstClockIn) return false
      const h = getHours(toZonedTime(new Date(wd.firstClockIn), timezone))
      return h >= 9 && h <= 10
    }).length,
    breaksTaken: allWorkDays.filter((wd) => (wd.breakMinutes || 0) > 0).length,
    weekendDays: allWorkDays.filter((wd) => {
      const d = new Date(wd.date)
      return d.getDay() === 0 || d.getDay() === 6
    }).length,
    fullDays: allWorkDays.filter((wd) => (wd.totalMinutes || 0) >= 480).length,
    overtimeDays: allWorkDays.filter((wd) => (wd.totalMinutes || 0) >= 600).length,
    kudosGiven: kudosGivenResult.count || 0,
    kudosReceived: kudosReceivedResult.count || 0,
    challengesCompleted: challengesResult.count || 0,
    hiddenBadgesFound,
    shieldsUsed: totalShieldsUsed,
    xpMultiplier: Number(profile?.xpMultiplier || 1.0),
    streakShields: profile?.streakShields || 0,
    totalStreakDays,
    streakLengths: completedStreakLengths,
  }
}
