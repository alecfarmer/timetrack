import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { subDays } from "date-fns"

export async function GET(request: NextRequest) {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  try {
    const now = new Date()
    const weekAgo = subDays(now, 7)

    // Get all rewards profiles for the org
    const { data: profiles } = await supabase
      .from("RewardsProfile")
      .select("userId, totalXp, level, currentStreak, longestStreak, coins, lastStreakDate")
      .eq("orgId", org.orgId)

    const totalMembers = profiles?.length || 0
    const activeStreaks = profiles?.filter((p) => p.currentStreak > 0).length || 0
    const avgLevel = totalMembers > 0
      ? Math.round((profiles?.reduce((sum, p) => sum + p.level, 0) || 0) / totalMembers * 10) / 10
      : 0
    const totalXpGranted = profiles?.reduce((sum, p) => sum + p.totalXp, 0) || 0

    // XP granted in last 7 days
    const { count: weeklyXpEntries } = await supabase
      .from("XpLedger")
      .select("*", { count: "exact", head: true })
      .eq("orgId", org.orgId)
      .gte("createdAt", weekAgo.toISOString())

    // Badges earned total and this week
    const { count: totalBadgesEarned } = await supabase
      .from("EarnedBadge")
      .select("*", { count: "exact", head: true })
      .eq("orgId", org.orgId)

    const { count: weeklyBadgesEarned } = await supabase
      .from("EarnedBadge")
      .select("*", { count: "exact", head: true })
      .eq("orgId", org.orgId)
      .gte("earnedAt", weekAgo.toISOString())

    // Challenges completed this week
    const { count: challengesCompleted } = await supabase
      .from("ActiveChallenge")
      .select("*", { count: "exact", head: true })
      .eq("orgId", org.orgId)
      .in("status", ["completed", "claimed"])
      .gte("updatedAt", weekAgo.toISOString())

    // Kudos sent this week
    const { count: kudosSent } = await supabase
      .from("Kudos")
      .select("*", { count: "exact", head: true })
      .eq("orgId", org.orgId)
      .gte("createdAt", weekAgo.toISOString())

    // Pending redemptions
    const { count: pendingRedemptions } = await supabase
      .from("Redemption")
      .select("*", { count: "exact", head: true })
      .eq("orgId", org.orgId)
      .eq("status", "pending")

    // Shop redemptions this week
    const { count: weeklyRedemptions } = await supabase
      .from("Redemption")
      .select("*", { count: "exact", head: true })
      .eq("orgId", org.orgId)
      .gte("createdAt", weekAgo.toISOString())

    // Top performers by XP
    const topPerformers = (profiles || [])
      .sort((a, b) => b.totalXp - a.totalXp)
      .slice(0, 5)
      .map((p) => ({
        userId: p.userId,
        totalXp: p.totalXp,
        level: p.level,
        currentStreak: p.currentStreak,
      }))

    // Level distribution
    const levelDistribution: Record<number, number> = {}
    profiles?.forEach((p) => {
      levelDistribution[p.level] = (levelDistribution[p.level] || 0) + 1
    })

    return NextResponse.json({
      overview: {
        totalMembers,
        activeStreaks,
        activeStreakPercent: totalMembers > 0 ? Math.round((activeStreaks / totalMembers) * 100) : 0,
        avgLevel,
        totalXpGranted,
      },
      weekly: {
        xpEntries: weeklyXpEntries || 0,
        badgesEarned: weeklyBadgesEarned || 0,
        challengesCompleted: challengesCompleted || 0,
        kudosSent: kudosSent || 0,
        redemptions: weeklyRedemptions || 0,
      },
      totals: {
        badgesEarned: totalBadgesEarned || 0,
        pendingRedemptions: pendingRedemptions || 0,
      },
      topPerformers,
      levelDistribution,
    })
  } catch (error) {
    console.error("Admin rewards metrics error:", error)
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}
