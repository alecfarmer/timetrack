import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { claimChallenge } from "@/lib/rewards/challenges"
import { z } from "zod"
import { validateBody } from "@/lib/validations"

const claimSchema = z.object({
  challengeId: z.string().min(1),
})

// GET /api/rewards/challenges — Active challenges with progress
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 403 })

    const now = new Date()

    // Expire old challenges first
    await supabase
      .from("ActiveChallenge")
      .update({ status: "expired" })
      .eq("userId", user!.id)
      .eq("orgId", org.orgId)
      .eq("status", "active")
      .lt("expiresAt", now.toISOString())

    // Fetch active and completed (unclaimed)
    const { data: challenges } = await supabase
      .from("ActiveChallenge")
      .select("*, definition:ChallengeDefinition(*)")
      .eq("userId", user!.id)
      .eq("orgId", org.orgId)
      .in("status", ["active", "completed"])
      .gt("expiresAt", now.toISOString())
      .order("createdAt", { ascending: false })

    // Fetch completed history
    const { data: history } = await supabase
      .from("ActiveChallenge")
      .select("*, definition:ChallengeDefinition(name, icon, type)")
      .eq("userId", user!.id)
      .eq("orgId", org.orgId)
      .eq("status", "claimed")
      .order("createdAt", { ascending: false })
      .limit(20)

    return NextResponse.json({
      active: (challenges || []).map((c) => ({
        id: c.id,
        definition: Array.isArray(c.definition) ? c.definition[0] : c.definition,
        progress: c.progress,
        target: c.target,
        status: c.status,
        expiresAt: c.expiresAt,
        xpReward: c.xpReward,
        coinReward: c.coinReward,
      })),
      history: (history || []).map((c) => ({
        id: c.id,
        definition: Array.isArray(c.definition) ? c.definition[0] : c.definition,
        xpReward: c.xpReward,
        coinReward: c.coinReward,
        createdAt: c.createdAt,
      })),
    })
  } catch (error) {
    console.error("Challenges error:", error)
    return NextResponse.json({ error: "Failed to fetch challenges" }, { status: 500 })
  }
}

// POST /api/rewards/challenges — Claim a completed challenge
export async function POST(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 403 })

    const body = await request.json()
    const validation = validateBody(claimSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const result = await claimChallenge(user!.id, org.orgId, validation.data.challengeId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Claim challenge error:", error)
    return NextResponse.json({ error: "Failed to claim challenge" }, { status: 500 })
  }
}
