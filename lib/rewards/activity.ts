import { supabaseAdmin } from "@/lib/supabase"

export type ActivityType =
  | "badge_earned"
  | "level_up"
  | "streak_milestone"
  | "challenge_completed"
  | "kudos_given"
  | "shop_redemption"
  | "title_unlocked"

/**
 * Log a rewards activity event for the org-wide social feed.
 */
export async function logRewardsActivity(
  orgId: string,
  userId: string,
  type: ActivityType,
  title: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await supabaseAdmin.from("RewardsActivity").insert({
      orgId,
      userId,
      type,
      title,
      metadata,
    })
  } catch (err) {
    // Activity logging is non-critical
    console.error("Failed to log rewards activity:", err)
  }
}
