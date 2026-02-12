import { supabaseAdmin } from "@/lib/supabase"
import { grantXp } from "./xp"
import { logRewardsActivity } from "./activity"

export interface BadgeEvalResult {
  badgeId: string
  slug: string
  name: string
  icon: string
  rarity: string
  xpReward: number
  coinReward: number
}

interface UserStats {
  totalOnsiteDays: number
  totalHours: number
  currentStreak: number
  longestStreak: number
  perfectWeeks: number
  thisMonthDays: number
  earlyBirdCount: number
  dawnPatrolCount: number
  nightOwlCount: number
  onTimeCount: number
  breaksTaken: number
  weekendDays: number
  fullDays: number
  overtimeDays: number
  kudosGiven: number
  kudosReceived: number
  challengesCompleted: number
  hiddenBadgesFound: number
  shieldsUsed: number
  // Extended stats for advanced badge criteria
  xpMultiplier: number
  streakShields: number
  totalStreakDays: number
  streakLengths: number[] // all historical streak lengths for streak_count badges
}

/**
 * Evaluate all badge definitions for a user, returning newly earned badges.
 * Checks unearned badges against user stats, inserts EarnedBadge, grants XP.
 */
export async function evaluateBadges(
  userId: string,
  orgId: string,
  stats: UserStats
): Promise<BadgeEvalResult[]> {
  // Fetch all badge definitions for org
  const { data: allBadges } = await supabaseAdmin
    .from("BadgeDefinition")
    .select("*")
    .eq("orgId", orgId)

  if (!allBadges || allBadges.length === 0) return []

  // Fetch already earned badges
  const { data: earnedBadges } = await supabaseAdmin
    .from("EarnedBadge")
    .select("badgeDefinitionId")
    .eq("userId", userId)
    .eq("orgId", orgId)

  const earnedSet = new Set((earnedBadges || []).map((eb) => eb.badgeDefinitionId))

  // Check each unearned badge
  const newlyEarned: BadgeEvalResult[] = []

  for (const badge of allBadges) {
    if (earnedSet.has(badge.id)) continue

    // Skip seasonal badges if out of season
    if (badge.isSeasonal && badge.seasonStart && badge.seasonEnd) {
      const now = new Date()
      const start = new Date(badge.seasonStart)
      const end = new Date(badge.seasonEnd)
      if (now < start || now > end) continue
    }

    const criteria = badge.criteria as Record<string, unknown>
    const earned = checkCriteria(criteria, stats)

    if (earned) {
      // Insert EarnedBadge
      await supabaseAdmin.from("EarnedBadge").insert({
        userId,
        orgId,
        badgeDefinitionId: badge.id,
        notified: false,
      })

      // Grant XP for badge (skip multiplier — badge XP is flat)
      if (badge.xpReward > 0) {
        await grantXp(userId, orgId, badge.xpReward, "BADGE_EARNED", {
          sourceType: "badge",
          sourceId: badge.id,
          skipMultiplier: true,
          metadata: { badgeSlug: badge.slug, badgeName: badge.name },
        })
      }

      // Grant coins directly
      if (badge.coinReward > 0) {
        const { data: coinProfile } = await supabaseAdmin
          .from("RewardsProfile")
          .select("coins")
          .eq("userId", userId)
          .eq("orgId", orgId)
          .single()

        if (coinProfile) {
          await supabaseAdmin
            .from("RewardsProfile")
            .update({ coins: coinProfile.coins + badge.coinReward })
            .eq("userId", userId)
            .eq("orgId", orgId)
        }
      }

      // Log activity
      await logRewardsActivity(orgId, userId, "badge_earned", `Earned "${badge.name}"`, {
        badgeSlug: badge.slug,
        badgeName: badge.name,
        badgeIcon: badge.icon,
        rarity: badge.rarity,
      })

      newlyEarned.push({
        badgeId: badge.id,
        slug: badge.slug,
        name: badge.name,
        icon: badge.icon,
        rarity: badge.rarity,
        xpReward: badge.xpReward,
        coinReward: badge.coinReward,
      })
    }
  }

  return newlyEarned
}

function checkCriteria(
  criteria: Record<string, unknown>,
  stats: UserStats
): boolean {
  const type = criteria.type as string

  switch (type) {
    case "threshold": {
      const stat = criteria.stat as keyof UserStats
      const threshold = criteria.threshold as number
      const val = stats[stat]
      return typeof val === "number" && val >= threshold
    }

    case "streak": {
      const threshold = criteria.threshold as number
      return stats.currentStreak >= threshold || stats.longestStreak >= threshold
    }

    case "multiplier_reach": {
      const multiplier = criteria.multiplier as number
      return stats.xpMultiplier >= multiplier
    }

    case "personal_best": {
      // Earned when current streak equals longest and longest > 0
      // (meaning this streak set a new record)
      return stats.currentStreak > 0 && stats.currentStreak === stats.longestStreak
    }

    case "streak_count": {
      // Count of completed streaks reaching minStreak length
      const minStreak = criteria.minStreak as number
      const count = criteria.count as number
      const qualifying = stats.streakLengths.filter((l) => l >= minStreak).length
      // Also count active streak if it qualifies
      const active = stats.currentStreak >= minStreak ? 1 : 0
      return qualifying + active >= count
    }

    case "total_streak_days": {
      const threshold = criteria.threshold as number
      return stats.totalStreakDays >= threshold
    }

    case "streak_no_shields": {
      const minStreak = criteria.minStreak as number
      // Current streak qualifies if long enough and no shields used (shieldsUsed=0 on active history)
      return stats.currentStreak >= minStreak && stats.shieldsUsed === 0
    }

    case "shields_accumulated": {
      const threshold = criteria.threshold as number
      return stats.streakShields >= threshold
    }

    case "streak_zero_shields": {
      const minStreak = criteria.minStreak as number
      return stats.currentStreak >= minStreak && stats.streakShields === 0
    }

    case "shields_used": {
      const threshold = criteria.threshold as number
      return stats.shieldsUsed >= threshold
    }

    case "streak_recovery":
    case "streak_comeback":
    case "streak_beat_previous":
    case "streak_double_previous":
    case "streak_rebuilds":
    case "streak_no_gap":
    case "shield_save_streak":
    case "shield_before_weekend":
    case "compounding_xp":
    case "xp_during_streak":
    case "streak_same_time":
    case "org_longest_streak":
    case "team_simultaneous_streak":
    case "streak_match":
    case "streak_trendsetter":
    case "org_only_streak":
      // These are event-based or require complex checks done elsewhere
      return false

    case "consecutive_months":
    case "qualifying_weeks_year":
    case "consistency_window":
    case "kudos_top_monthly":
    case "seasonal_date":
    case "seasonal_month":
    case "holiday_work":
    case "tenure_days":
    case "badge_set_complete":
      // These require specialized checks done elsewhere
      return false

    default:
      return false
  }
}

/**
 * Get badge progress for all badges (for UI display).
 */
export async function getBadgeProgress(
  userId: string,
  orgId: string,
  stats: UserStats
): Promise<Array<{
  badge: { id: string; slug: string; name: string; description: string; icon: string; category: string; rarity: string; isHidden: boolean; setId: string | null; xpReward: number; coinReward: number }
  earned: boolean
  earnedAt: string | null
  progress: number
  target: number
}>> {
  const { data: allBadges } = await supabaseAdmin
    .from("BadgeDefinition")
    .select("*")
    .eq("orgId", orgId)

  const { data: earnedBadges } = await supabaseAdmin
    .from("EarnedBadge")
    .select("badgeDefinitionId, earnedAt")
    .eq("userId", userId)
    .eq("orgId", orgId)

  const earnedMap = new Map(
    (earnedBadges || []).map((eb) => [eb.badgeDefinitionId, eb.earnedAt])
  )

  return (allBadges || []).map((badge) => {
    const criteria = badge.criteria as Record<string, unknown>
    const { progress, target } = getProgressForCriteria(criteria, stats)
    const earnedAt = earnedMap.get(badge.id) || null

    return {
      badge: {
        id: badge.id,
        slug: badge.slug,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        rarity: badge.rarity,
        isHidden: badge.isHidden,
        setId: badge.setId,
        xpReward: badge.xpReward,
        coinReward: badge.coinReward,
      },
      earned: !!earnedAt,
      earnedAt,
      progress,
      target,
    }
  })
}

function getProgressForCriteria(
  criteria: Record<string, unknown>,
  stats: UserStats
): { progress: number; target: number } {
  const type = criteria.type as string

  switch (type) {
    case "threshold": {
      const stat = criteria.stat as keyof UserStats
      const threshold = criteria.threshold as number
      const val = stats[stat]
      return { progress: Math.min(typeof val === "number" ? val : 0, threshold), target: threshold }
    }
    case "streak": {
      const threshold = criteria.threshold as number
      return {
        progress: Math.min(Math.max(stats.currentStreak, stats.longestStreak), threshold),
        target: threshold,
      }
    }
    case "multiplier_reach": {
      const multiplier = criteria.multiplier as number
      // Show progress as percentage toward target multiplier (1.0 = base)
      const progress = Math.min(stats.xpMultiplier, multiplier)
      return { progress: Math.round(progress * 100), target: Math.round(multiplier * 100) }
    }
    case "streak_count": {
      const minStreak = criteria.minStreak as number
      const count = criteria.count as number
      const qualifying = stats.streakLengths.filter((l) => l >= minStreak).length
      const active = stats.currentStreak >= minStreak ? 1 : 0
      return { progress: Math.min(qualifying + active, count), target: count }
    }
    case "total_streak_days": {
      const threshold = criteria.threshold as number
      return { progress: Math.min(stats.totalStreakDays, threshold), target: threshold }
    }
    case "shields_used": {
      const threshold = criteria.threshold as number
      return { progress: Math.min(stats.shieldsUsed, threshold), target: threshold }
    }
    case "shields_accumulated": {
      const threshold = criteria.threshold as number
      return { progress: Math.min(stats.streakShields, threshold), target: threshold }
    }
    case "personal_best": {
      return { progress: stats.currentStreak === stats.longestStreak && stats.longestStreak > 0 ? 1 : 0, target: 1 }
    }
    default:
      return { progress: 0, target: 1 }
  }
}
