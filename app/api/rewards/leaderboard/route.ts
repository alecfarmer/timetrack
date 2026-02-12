import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { getRequestTimezone } from "@/lib/validations"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { toZonedTime } from "date-fns-tz"

// GET /api/rewards/leaderboard — Rankings by period + category
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 403 })

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get("period") || "weekly"
    const category = searchParams.get("category") || "xp"
    const timezone = getRequestTimezone(request)
    const zonedNow = toZonedTime(new Date(), timezone)

    const orgId = org.orgId
    const userId = user!.id

    let rankings: Array<{ userId: string; displayName: string; value: number; rank: number }> = []

    if (category === "xp") {
      if (period === "weekly") {
        const weekStart = startOfWeek(zonedNow, { weekStartsOn: 1 })
        const { data } = await supabase
          .from("XpLedger")
          .select("userId, amount")
          .eq("orgId", orgId)
          .gte("createdAt", weekStart.toISOString())

        rankings = aggregateRankings(data || [], "amount")
      } else {
        const monthStart = startOfMonth(zonedNow)
        const { data } = await supabase
          .from("XpLedger")
          .select("userId, amount")
          .eq("orgId", orgId)
          .gte("createdAt", monthStart.toISOString())

        rankings = aggregateRankings(data || [], "amount")
      }
    } else if (category === "streak") {
      const { data } = await supabase
        .from("RewardsProfile")
        .select("userId, currentStreak")
        .eq("orgId", orgId)
        .eq("leaderboardOptIn", true)
        .gt("currentStreak", 0)
        .order("currentStreak", { ascending: false })
        .limit(10)

      rankings = (data || []).map((r, i) => ({
        userId: r.userId,
        displayName: "",
        value: r.currentStreak,
        rank: i + 1,
      }))
    } else if (category === "kudos") {
      const weekStart = period === "weekly"
        ? format(startOfWeek(zonedNow, { weekStartsOn: 1 }), "yyyy-MM-dd")
        : format(startOfMonth(zonedNow), "yyyy-MM-dd")

      const { data } = await supabase
        .from("Kudos")
        .select("toUserId")
        .eq("orgId", orgId)
        .gte("weekOf", weekStart)

      const counts = new Map<string, number>()
      for (const k of data || []) {
        counts.set(k.toUserId, (counts.get(k.toUserId) || 0) + 1)
      }

      rankings = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([uid, value], i) => ({
          userId: uid,
          displayName: "",
          value,
          rank: i + 1,
        }))
    }

    // Enrich with display names from auth
    const userIds = rankings.map((r) => r.userId)
    if (userIds.length > 0) {
      const { data: memberships } = await supabase
        .from("Membership")
        .select("userId")
        .eq("orgId", orgId)
        .in("userId", userIds)

      // Check opt-in status
      const { data: profiles } = await supabase
        .from("RewardsProfile")
        .select("userId, leaderboardOptIn")
        .eq("orgId", orgId)
        .in("userId", userIds)

      const optedOut = new Set(
        (profiles || []).filter((p) => !p.leaderboardOptIn).map((p) => p.userId)
      )

      rankings = rankings.filter((r) => !optedOut.has(r.userId))
      // Re-rank after filtering
      rankings = rankings.map((r, i) => ({ ...r, rank: i + 1 }))
    }

    // Find current user's position
    const userRank = rankings.find((r) => r.userId === userId)

    return NextResponse.json({
      rankings: rankings.slice(0, 10),
      userRank: userRank || null,
      period,
      category,
    })
  } catch (error) {
    console.error("Leaderboard error:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
  }
}

function aggregateRankings(
  data: Array<{ userId: string; amount: number }>,
  field: string
): Array<{ userId: string; displayName: string; value: number; rank: number }> {
  const totals = new Map<string, number>()
  for (const entry of data) {
    totals.set(entry.userId, (totals.get(entry.userId) || 0) + entry.amount)
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, value], i) => ({
      userId,
      displayName: "",
      value,
      rank: i + 1,
    }))
}
