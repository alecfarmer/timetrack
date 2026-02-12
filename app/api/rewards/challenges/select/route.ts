import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { z } from "zod"
import { validateBody } from "@/lib/validations"
import { addDays } from "date-fns"

const selectSchema = z.object({
  challengeDefinitionId: z.string().min(1),
})

// POST /api/rewards/challenges/select — Pick a personal challenge
export async function POST(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 403 })

    const body = await request.json()
    const validation = validateBody(selectSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Check user doesn't already have 2 personal challenges
    const { count: activePersonal } = await supabase
      .from("ActiveChallenge")
      .select("id", { count: "exact", head: true })
      .eq("userId", user!.id)
      .eq("orgId", org.orgId)
      .in("status", ["active", "completed"])

    if ((activePersonal || 0) >= 7) {
      return NextResponse.json({ error: "Too many active challenges" }, { status: 400 })
    }

    // Verify the definition exists and is personal type
    const { data: def } = await supabase
      .from("ChallengeDefinition")
      .select("*")
      .eq("id", validation.data.challengeDefinitionId)
      .eq("orgId", org.orgId)
      .eq("type", "personal")
      .single()

    if (!def) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    // Create the active challenge (7-day window for personal)
    const expiresAt = addDays(new Date(), 7)
    const target = (def.criteria as Record<string, unknown>).threshold as number || 1

    const { data: challenge, error } = await supabase
      .from("ActiveChallenge")
      .insert({
        userId: user!.id,
        orgId: org.orgId,
        challengeDefinitionId: def.id,
        progress: 0,
        target,
        status: "active",
        expiresAt: expiresAt.toISOString(),
        xpReward: def.xpReward,
        coinReward: def.coinReward,
      })
      .select("*")
      .single()

    if (error) {
      console.error("Select challenge error:", error)
      return NextResponse.json({ error: "Failed to select challenge" }, { status: 500 })
    }

    return NextResponse.json({ challenge })
  } catch (error) {
    console.error("Select challenge error:", error)
    return NextResponse.json({ error: "Failed to select challenge" }, { status: 500 })
  }
}
