import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

const SHIELD_COST = 50

// POST /api/rewards/streak/shield — Purchase a streak shield with coins
export async function POST(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 403 })

    const { data: profile } = await supabase
      .from("RewardsProfile")
      .select("id, coins, streakShields")
      .eq("userId", user!.id)
      .eq("orgId", org.orgId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    if (profile.coins < SHIELD_COST) {
      return NextResponse.json({ error: "Not enough coins", required: SHIELD_COST, available: profile.coins }, { status: 400 })
    }

    await supabase
      .from("RewardsProfile")
      .update({
        coins: profile.coins - SHIELD_COST,
        streakShields: profile.streakShields + 1,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", profile.id)

    return NextResponse.json({
      success: true,
      coins: profile.coins - SHIELD_COST,
      streakShields: profile.streakShields + 1,
    })
  } catch (error) {
    console.error("Shield purchase error:", error)
    return NextResponse.json({ error: "Failed to purchase shield" }, { status: 500 })
  }
}
