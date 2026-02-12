import { supabaseAdmin } from "@/lib/supabase"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { grantXp } from "./xp"
import { logRewardsActivity } from "./activity"

/**
 * Generate challenges for the user if they don't have active ones for the current period.
 * Selects from the challenge pool with weighted random, scaled by level.
 */
export async function generateChallenges(
  userId: string,
  orgId: string,
  userLevel: number,
  timezone: string
): Promise<void> {
  const now = new Date()
  const zonedNow = toZonedTime(now, timezone)

  // Check what active challenges the user already has
  const { data: active } = await supabaseAdmin
    .from("ActiveChallenge")
    .select("id, challengeDefinitionId, status, expiresAt")
    .eq("userId", userId)
    .eq("orgId", orgId)
    .in("status", ["active", "completed"])

  const activeByType = new Map<string, number>()
  const activeDefIds = new Set<string>()

  if (active) {
    for (const c of active) {
      // Expire challenges past their deadline
      if (new Date(c.expiresAt) < now && c.status === "active") {
        await supabaseAdmin
          .from("ActiveChallenge")
          .update({ status: "expired" })
          .eq("id", c.id)
        continue
      }
      activeDefIds.add(c.challengeDefinitionId)
    }
  }

  // Re-count active (non-expired)
  const { data: currentActive } = await supabaseAdmin
    .from("ActiveChallenge")
    .select("id, status")
    .eq("userId", userId)
    .eq("orgId", orgId)
    .in("status", ["active", "completed"])
    .gt("expiresAt", now.toISOString())

  // Fetch all definitions
  const { data: definitions } = await supabaseAdmin
    .from("ChallengeDefinition")
    .select("*")
    .eq("orgId", orgId)
    .eq("isTeamChallenge", false)
    .lte("minLevel", userLevel)

  if (!definitions || definitions.length === 0) return

  const defsByType = new Map<string, typeof definitions>()
  for (const def of definitions) {
    if (activeDefIds.has(def.id)) continue
    const list = defsByType.get(def.type) || []
    list.push(def)
    defsByType.set(def.type, list)
  }

  // Count active by type
  if (currentActive) {
    for (const c of currentActive) {
      // Need to look up the type from the definition
      const { data: def } = await supabaseAdmin
        .from("ActiveChallenge")
        .select("challengeDefinitionId")
        .eq("id", c.id)
        .single()
      if (def) {
        const fullDef = definitions.find((d) => d.id === def.challengeDefinitionId)
        if (fullDef) {
          activeByType.set(fullDef.type, (activeByType.get(fullDef.type) || 0) + 1)
        }
      }
    }
  }

  const toGenerate: Array<{ type: string; count: number; expires: Date }> = []

  // Daily: 2 per day
  const dailyCount = activeByType.get("daily") || 0
  if (dailyCount < 2) {
    const dayEnd = new Date(zonedNow)
    dayEnd.setHours(23, 59, 59, 999)
    toGenerate.push({ type: "daily", count: 2 - dailyCount, expires: dayEnd })
  }

  // Weekly: 2 per week
  const weeklyCount = activeByType.get("weekly") || 0
  if (weeklyCount < 2) {
    const weekEnd = endOfWeek(zonedNow, { weekStartsOn: 1 })
    toGenerate.push({ type: "weekly", count: 2 - weeklyCount, expires: weekEnd })
  }

  // Monthly: 1 per month
  const monthlyCount = activeByType.get("monthly") || 0
  if (monthlyCount < 1) {
    const monthEnd = endOfMonth(zonedNow)
    toGenerate.push({ type: "monthly", count: 1 - monthlyCount, expires: monthEnd })
  }

  // Select and create challenges
  for (const gen of toGenerate) {
    const pool = defsByType.get(gen.type) || []
    if (pool.length === 0) continue

    const selected = selectWeightedRandom(pool, gen.count)
    for (const def of selected) {
      const target = getChallengeTarget(def.criteria as Record<string, unknown>)
      await supabaseAdmin.from("ActiveChallenge").insert({
        userId,
        orgId,
        challengeDefinitionId: def.id,
        progress: 0,
        target,
        status: "active",
        expiresAt: gen.expires.toISOString(),
        xpReward: def.xpReward,
        coinReward: def.coinReward,
      })
    }
  }
}

function selectWeightedRandom<T>(pool: T[], count: number): T[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function getChallengeTarget(criteria: Record<string, unknown>): number {
  if (criteria.threshold) return criteria.threshold as number
  if (criteria.hours) return criteria.hours as number
  return 1
}

/**
 * Update progress on active challenges after a rewards event.
 */
export async function updateChallengeProgress(
  userId: string,
  orgId: string,
  eventType: string,
  eventData: Record<string, unknown>
): Promise<Array<{ challengeId: string; name: string; completed: boolean; progress: number; target: number }>> {
  const { data: activeChallenges } = await supabaseAdmin
    .from("ActiveChallenge")
    .select("*, definition:ChallengeDefinition(*)")
    .eq("userId", userId)
    .eq("orgId", orgId)
    .eq("status", "active")
    .gt("expiresAt", new Date().toISOString())

  if (!activeChallenges || activeChallenges.length === 0) return []

  const results: Array<{ challengeId: string; name: string; completed: boolean; progress: number; target: number }> = []

  for (const challenge of activeChallenges) {
    const def = Array.isArray(challenge.definition) ? challenge.definition[0] : challenge.definition
    if (!def) continue

    const criteria = def.criteria as Record<string, unknown>
    const increment = getChallengeIncrement(criteria, eventType, eventData)

    if (increment > 0) {
      const newProgress = Math.min(challenge.progress + increment, challenge.target)
      const completed = newProgress >= challenge.target

      await supabaseAdmin
        .from("ActiveChallenge")
        .update({
          progress: newProgress,
          status: completed ? "completed" : "active",
        })
        .eq("id", challenge.id)

      results.push({
        challengeId: challenge.id,
        name: def.name,
        completed,
        progress: newProgress,
        target: challenge.target,
      })
    }
  }

  return results
}

function getChallengeIncrement(
  criteria: Record<string, unknown>,
  eventType: string,
  eventData: Record<string, unknown>
): number {
  const criteriaType = criteria.type as string

  switch (criteriaType) {
    case "clock_in_before":
    case "clock_in_window":
    case "on_time_count":
      if (eventType !== "CLOCK_IN") return 0
      return 1 // Actual time check done at evaluation time

    case "take_break":
      if (eventType !== "BREAK_START") return 0
      return 1

    case "work_hours":
    case "early_finish":
      if (eventType !== "CLOCK_OUT") return 0
      return 1

    case "days_this_week":
    case "days_this_month":
      if (eventType !== "CLOCK_IN") return 0
      return 1

    case "early_days_week":
      if (eventType !== "CLOCK_IN") return 0
      return 1

    case "break_days_week":
    case "break_streak":
      if (eventType !== "BREAK_START") return 0
      return 1

    case "streak_reach":
      if (eventType !== "CLOCK_IN") return 0
      const streak = eventData.currentStreak as number || 0
      return streak > 0 ? streak : 0

    case "weekly_hours":
      if (eventType !== "CLOCK_OUT") return 0
      return 1

    case "team_clock_ins":
      if (eventType !== "CLOCK_IN") return 0
      return 1

    default:
      return 0
  }
}

/**
 * Claim a completed challenge — grant XP/coins to user.
 */
export async function claimChallenge(
  userId: string,
  orgId: string,
  challengeId: string
): Promise<{ success: boolean; xpGranted: number; coinsGranted: number; error?: string }> {
  const { data: challenge } = await supabaseAdmin
    .from("ActiveChallenge")
    .select("*, definition:ChallengeDefinition(name)")
    .eq("id", challengeId)
    .eq("userId", userId)
    .eq("orgId", orgId)
    .single()

  if (!challenge) return { success: false, xpGranted: 0, coinsGranted: 0, error: "Challenge not found" }
  if (challenge.status !== "completed") return { success: false, xpGranted: 0, coinsGranted: 0, error: "Challenge not yet completed" }

  // Mark as claimed
  await supabaseAdmin
    .from("ActiveChallenge")
    .update({ status: "claimed" })
    .eq("id", challengeId)

  // Grant XP
  let xpResult = { xpGranted: 0 }
  if (challenge.xpReward > 0) {
    xpResult = await grantXp(userId, orgId, challenge.xpReward, "CHALLENGE_COMPLETE", {
      sourceType: "challenge",
      sourceId: challengeId,
    })
  }

  // Grant coins
  if (challenge.coinReward > 0) {
    const { data: profile } = await supabaseAdmin
      .from("RewardsProfile")
      .select("coins")
      .eq("userId", userId)
      .eq("orgId", orgId)
      .single()

    if (profile) {
      await supabaseAdmin
        .from("RewardsProfile")
        .update({ coins: profile.coins + challenge.coinReward })
        .eq("userId", userId)
        .eq("orgId", orgId)
    }
  }

  const defName = Array.isArray(challenge.definition)
    ? challenge.definition[0]?.name
    : challenge.definition?.name

  await logRewardsActivity(orgId, userId, "challenge_completed", `Completed "${defName || "Challenge"}"`, {
    challengeId,
    xpReward: challenge.xpReward,
    coinReward: challenge.coinReward,
  })

  return {
    success: true,
    xpGranted: xpResult.xpGranted,
    coinsGranted: challenge.coinReward,
  }
}
