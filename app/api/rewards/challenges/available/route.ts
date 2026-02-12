import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// GET /api/rewards/challenges/available — Personal challenge pool
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 403 })

    // Get user level
    const { data: profile } = await supabase
      .from("RewardsProfile")
      .select("level")
      .eq("userId", user!.id)
      .eq("orgId", org.orgId)
      .single()

    const userLevel = profile?.level || 1

    // Get personal challenges not already active
    const { data: activeIds } = await supabase
      .from("ActiveChallenge")
      .select("challengeDefinitionId")
      .eq("userId", user!.id)
      .eq("orgId", org.orgId)
      .in("status", ["active", "completed"])

    const excludeIds = (activeIds || []).map((a) => a.challengeDefinitionId)

    let query = supabase
      .from("ChallengeDefinition")
      .select("*")
      .eq("orgId", org.orgId)
      .eq("type", "personal")
      .lte("minLevel", userLevel)

    if (excludeIds.length > 0) {
      // Filter out already active ones by fetching all and filtering in JS
      // (Supabase doesn't support NOT IN directly)
    }

    const { data: available } = await query

    const filtered = (available || []).filter((d) => !excludeIds.includes(d.id))

    return NextResponse.json({ challenges: filtered })
  } catch (error) {
    console.error("Available challenges error:", error)
    return NextResponse.json({ error: "Failed to fetch available challenges" }, { status: 500 })
  }
}
