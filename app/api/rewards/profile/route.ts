import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { getXpProgress } from "@/lib/rewards/levels"
import { getRequestTimezone } from "@/lib/validations"

// GET /api/rewards/profile — Full rewards profile
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 403 })

    const userId = user!.id
    const orgId = org.orgId

    // Fetch profile, earned badges, active challenges, and title in parallel
    const [profileResult, earnedBadgesResult, activeChallengesResult, titleResult] = await Promise.all([
      supabase
        .from("RewardsProfile")
        .select("*")
        .eq("userId", userId)
        .eq("orgId", orgId)
        .single(),

      supabase
        .from("EarnedBadge")
        .select("*, badge:BadgeDefinition(*)")
        .eq("userId", userId)
        .eq("orgId", orgId)
        .order("earnedAt", { ascending: false }),

      supabase
        .from("ActiveChallenge")
        .select("*, definition:ChallengeDefinition(*)")
        .eq("userId", userId)
        .eq("orgId", orgId)
        .in("status", ["active", "completed"])
        .gt("expiresAt", new Date().toISOString()),

      supabase
        .from("Title")
        .select("*")
        .eq("orgId", orgId)
        .order("sortOrder", { ascending: true }),
    ])

    let profile = profileResult.data
    if (!profile) {
      // Create a default profile
      const { data: newProfile, error: insertError } = await supabase
        .from("RewardsProfile")
        .insert({ userId, orgId, totalXp: 0, level: 1 })
        .select("*")
        .single()

      if (insertError || !newProfile) {
        // Tables may not exist yet — return a safe fallback
        return NextResponse.json({
          profile: { userId, orgId, totalXp: 0, level: 1, currentStreak: 0, longestStreak: 0, streakShields: 0, coins: 0, xpMultiplier: 1.0, titleId: null, showcaseBadges: [], leaderboardOptIn: true, activeTitle: null },
          levelProgress: getXpProgress(0),
          earnedBadges: [],
          activeChallenges: [],
          titles: [],
          unclaimedCount: 0,
        })
      }

      return NextResponse.json({
        profile: newProfile,
        levelProgress: getXpProgress(0),
        earnedBadges: [],
        activeChallenges: [],
        titles: titleResult.data || [],
        unclaimedCount: 0,
      })
    }

    const levelProgress = getXpProgress(profile.totalXp)

    // Get active title info
    let activeTitle = null
    if (profile.titleId) {
      activeTitle = (titleResult.data || []).find((t) => t.id === profile.titleId) || null
    }

    // Count unclaimed challenges
    const unclaimedCount = (activeChallengesResult.data || []).filter(
      (c) => c.status === "completed"
    ).length

    return NextResponse.json({
      profile: {
        ...profile,
        activeTitle,
      },
      levelProgress,
      earnedBadges: (earnedBadgesResult.data || []).map((eb) => ({
        id: eb.id,
        badge: Array.isArray(eb.badge) ? eb.badge[0] : eb.badge,
        earnedAt: eb.earnedAt,
      })),
      activeChallenges: (activeChallengesResult.data || []).map((ac) => ({
        id: ac.id,
        definition: Array.isArray(ac.definition) ? ac.definition[0] : ac.definition,
        progress: ac.progress,
        target: ac.target,
        status: ac.status,
        expiresAt: ac.expiresAt,
        xpReward: ac.xpReward,
        coinReward: ac.coinReward,
      })),
      titles: titleResult.data || [],
      unclaimedCount,
    })
  } catch (error) {
    console.error("Rewards profile error:", error)
    // Return a safe fallback so the UI doesn't crash
    return NextResponse.json({
      profile: { totalXp: 0, level: 1, currentStreak: 0, longestStreak: 0, streakShields: 0, coins: 0, xpMultiplier: 1.0, titleId: null, showcaseBadges: [], leaderboardOptIn: true, activeTitle: null },
      levelProgress: getXpProgress(0),
      earnedBadges: [],
      activeChallenges: [],
      titles: [],
      unclaimedCount: 0,
    })
  }
}
