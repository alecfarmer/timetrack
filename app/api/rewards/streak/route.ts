import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// GET /api/rewards/streak — Streak history timeline
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 403 })

    const [profileResult, historyResult] = await Promise.all([
      supabase
        .from("RewardsProfile")
        .select("currentStreak, longestStreak, streakShields, lastStreakDate, xpMultiplier")
        .eq("userId", user!.id)
        .eq("orgId", org.orgId)
        .single(),

      supabase
        .from("StreakHistory")
        .select("*")
        .eq("userId", user!.id)
        .eq("orgId", org.orgId)
        .order("startDate", { ascending: false })
        .limit(20),
    ])

    return NextResponse.json({
      current: profileResult.data || { currentStreak: 0, longestStreak: 0, streakShields: 0, lastStreakDate: null, xpMultiplier: 1.0 },
      history: historyResult.data || [],
    })
  } catch (error) {
    console.error("Streak error:", error)
    return NextResponse.json({ error: "Failed to fetch streak data" }, { status: 500 })
  }
}
