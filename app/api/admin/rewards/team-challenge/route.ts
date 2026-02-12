import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { z } from "zod/v4"
import { validateBody } from "@/lib/validations"
import { addDays } from "date-fns"

const createTeamChallengeSchema = z.object({
  challengeDefinitionId: z.string().optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(10).default("👥"),
  target: z.number().int().min(1),
  xpReward: z.number().int().min(1),
  coinReward: z.number().int().min(0).default(0),
  durationDays: z.number().int().min(1).max(30).default(7),
})

export async function POST(request: NextRequest) {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const validated = validateBody(createTeamChallengeSchema, body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const { challengeDefinitionId, name, description, icon, target, xpReward, coinReward, durationDays } = validated.data

    let defId = challengeDefinitionId

    // If no existing definition, create one
    if (!defId) {
      if (!name || !description) {
        return NextResponse.json({ error: "Name and description required for new team challenge" }, { status: 400 })
      }

      const { data: def, error: defError } = await supabase
        .from("ChallengeDefinition")
        .insert({
          orgId: org.orgId,
          name,
          description,
          icon,
          type: "team",
          criteria: { type: "team_clockins", target },
          xpReward,
          coinReward,
          isTeamChallenge: true,
          teamTarget: target,
        })
        .select()
        .single()

      if (defError) throw defError
      defId = def.id
    }

    // Create the active team challenge (userId = null for team challenges)
    const expiresAt = addDays(new Date(), durationDays)

    const { data: challenge, error } = await supabase
      .from("ActiveChallenge")
      .insert({
        userId: null,
        orgId: org.orgId,
        challengeDefinitionId: defId,
        progress: 0,
        target,
        status: "active",
        expiresAt: expiresAt.toISOString(),
        xpReward,
        coinReward,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(challenge, { status: 201 })
  } catch (error) {
    console.error("Create team challenge error:", error)
    return NextResponse.json({ error: "Failed to create team challenge" }, { status: 500 })
  }
}
