import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { z } from "zod/v4"
import { validateBody } from "@/lib/validations"

const createChallengeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  icon: z.string().max(10).default("🎯"),
  type: z.enum(["daily", "weekly", "monthly", "team", "personal"]),
  criteria: z.object({
    type: z.string(),
    target: z.number().int().min(1),
    conditions: z.record(z.string(), z.unknown()).optional(),
  }),
  xpReward: z.number().int().min(1),
  coinReward: z.number().int().min(0).default(0),
  minLevel: z.number().int().min(1).default(1),
  isTeamChallenge: z.boolean().default(false),
  teamTarget: z.number().int().nullable().optional(),
})

const updateChallengeSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(10).optional(),
  xpReward: z.number().int().min(1).optional(),
  coinReward: z.number().int().min(0).optional(),
  minLevel: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  try {
    const { data: definitions, error } = await supabase
      .from("ChallengeDefinition")
      .select("*")
      .eq("orgId", org.orgId)
      .order("type")
      .order("name")

    if (error) throw error

    // Get completion stats
    const { data: completions } = await supabase
      .from("ActiveChallenge")
      .select("challengeDefinitionId, status")
      .eq("orgId", org.orgId)
      .in("status", ["completed", "claimed"])

    const completionCounts: Record<string, number> = {}
    completions?.forEach((c) => {
      completionCounts[c.challengeDefinitionId] = (completionCounts[c.challengeDefinitionId] || 0) + 1
    })

    const enriched = (definitions || []).map((d) => ({
      ...d,
      completionCount: completionCounts[d.id] || 0,
    }))

    return NextResponse.json({ challenges: enriched })
  } catch (error) {
    console.error("Admin challenges error:", error)
    return NextResponse.json({ error: "Failed to fetch challenges" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const validated = validateBody(createChallengeSchema, body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const { data: challenge, error } = await supabase
      .from("ChallengeDefinition")
      .insert({
        orgId: org.orgId,
        ...validated.data,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(challenge, { status: 201 })
  } catch (error) {
    console.error("Create challenge error:", error)
    return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const validated = validateBody(updateChallengeSchema, body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const { id, ...updates } = validated.data
    const { data: challenge, error } = await supabase
      .from("ChallengeDefinition")
      .update(updates)
      .eq("id", id)
      .eq("orgId", org.orgId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(challenge)
  } catch (error) {
    console.error("Update challenge error:", error)
    return NextResponse.json({ error: "Failed to update challenge" }, { status: 500 })
  }
}
