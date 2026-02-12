import { supabaseAdmin } from "@/lib/supabase"
import { getLevelForXp, getNextLevel, LEVELS } from "./levels"

export type XpReason =
  | "CLOCK_IN"
  | "BADGE_EARNED"
  | "CHALLENGE_COMPLETE"
  | "KUDOS_RECEIVED"
  | "KUDOS_GIVEN"
  | "STREAK_BONUS"
  | "SHOP_SPEND"
  | "DAILY_BONUS"
  | "COMBO"
  | "ADMIN_GRANT"
  | "DECAY"
  | "MIGRATION"
  | "LEVEL_UP"

export interface XpGrantResult {
  xpGranted: number
  newTotal: number
  leveledUp: boolean
  newLevel: number
  coinsEarned: number
  shieldsEarned: number
}

/**
 * Single entry point for granting XP to a user.
 * Reads user's multiplier, writes XpLedger, atomically updates RewardsProfile.
 */
export async function grantXp(
  userId: string,
  orgId: string,
  baseAmount: number,
  reason: XpReason,
  options?: {
    sourceType?: string
    sourceId?: string
    metadata?: Record<string, unknown>
    skipMultiplier?: boolean
  }
): Promise<XpGrantResult> {
  // Get current profile
  const { data: profile } = await supabaseAdmin
    .from("RewardsProfile")
    .select("id, totalXp, level, xpMultiplier, coins, streakShields")
    .eq("userId", userId)
    .eq("orgId", orgId)
    .single()

  if (!profile) {
    // Create profile on first XP grant
    const { data: newProfile } = await supabaseAdmin
      .from("RewardsProfile")
      .insert({ userId, orgId, totalXp: 0, level: 1 })
      .select("id, totalXp, level, xpMultiplier, coins, streakShields")
      .single()

    if (!newProfile) throw new Error("Failed to create rewards profile")
    return grantXpToProfile(newProfile, userId, orgId, baseAmount, reason, options)
  }

  return grantXpToProfile(profile, userId, orgId, baseAmount, reason, options)
}

async function grantXpToProfile(
  profile: {
    id: string
    totalXp: number
    level: number
    xpMultiplier: number
    coins: number
    streakShields: number
  },
  userId: string,
  orgId: string,
  baseAmount: number,
  reason: XpReason,
  options?: {
    sourceType?: string
    sourceId?: string
    metadata?: Record<string, unknown>
    skipMultiplier?: boolean
  }
): Promise<XpGrantResult> {
  const multiplier = options?.skipMultiplier ? 1.0 : Number(profile.xpMultiplier)
  const xpGranted = Math.round(baseAmount * multiplier)
  const newTotal = profile.totalXp + xpGranted

  const oldLevel = profile.level
  const newLevelDef = getLevelForXp(newTotal)
  const leveledUp = newLevelDef.level > oldLevel

  // Calculate level-up rewards
  let coinsEarned = 0
  let shieldsEarned = 0
  if (leveledUp) {
    for (let l = oldLevel + 1; l <= newLevelDef.level; l++) {
      const levelDef = LEVELS[l - 1]
      coinsEarned += levelDef.coinReward
      shieldsEarned += levelDef.streakShieldReward
    }
  }

  // Write XP ledger entry
  await supabaseAdmin.from("XpLedger").insert({
    userId,
    orgId,
    amount: xpGranted,
    reason,
    sourceType: options?.sourceType,
    sourceId: options?.sourceId,
    multiplier,
    metadata: options?.metadata,
  })

  // Atomically update profile
  await supabaseAdmin
    .from("RewardsProfile")
    .update({
      totalXp: newTotal,
      level: newLevelDef.level,
      coins: profile.coins + coinsEarned,
      streakShields: profile.streakShields + shieldsEarned,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", profile.id)

  return {
    xpGranted,
    newTotal,
    leveledUp,
    newLevel: newLevelDef.level,
    coinsEarned,
    shieldsEarned,
  }
}

/**
 * Ensure a RewardsProfile exists for the user, creating one if needed.
 */
export async function ensureProfile(userId: string, orgId: string) {
  const { data: existing } = await supabaseAdmin
    .from("RewardsProfile")
    .select("id")
    .eq("userId", userId)
    .eq("orgId", orgId)
    .single()

  if (existing) return existing

  const { data: created } = await supabaseAdmin
    .from("RewardsProfile")
    .insert({ userId, orgId, totalXp: 0, level: 1 })
    .select("id")
    .single()

  return created
}
