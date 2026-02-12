import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { z } from "zod/v4"
import { validateBody } from "@/lib/validations"

const createBadgeSchema = z.object({
  slug: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  icon: z.string().max(10).default("🏆"),
  category: z.enum(["streak", "milestone", "time", "consistency", "special", "social", "seasonal", "hidden", "collection"]),
  rarity: z.enum(["common", "uncommon", "rare", "epic", "legendary"]).default("common"),
  xpReward: z.number().int().min(0).default(25),
  coinReward: z.number().int().min(0).default(0),
  isHidden: z.boolean().default(false),
  isSeasonal: z.boolean().default(false),
  seasonStart: z.string().nullable().optional(),
  seasonEnd: z.string().nullable().optional(),
  criteria: z.object({
    type: z.string(),
    target: z.number().int().min(1).optional(),
    conditions: z.record(z.string(), z.unknown()).optional(),
  }),
  setId: z.string().nullable().optional(),
})

const updateBadgeSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(10).optional(),
  rarity: z.enum(["common", "uncommon", "rare", "epic", "legendary"]).optional(),
  xpReward: z.number().int().min(0).optional(),
  coinReward: z.number().int().min(0).optional(),
  isHidden: z.boolean().optional(),
  isSeasonal: z.boolean().optional(),
  seasonStart: z.string().nullable().optional(),
  seasonEnd: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  try {
    const { data: badges, error } = await supabase
      .from("BadgeDefinition")
      .select("*")
      .eq("orgId", org.orgId)
      .order("category")
      .order("name")

    if (error) throw error

    // Get earning rates
    const { data: earned } = await supabase
      .from("EarnedBadge")
      .select("badgeDefinitionId")
      .eq("orgId", org.orgId)

    const earningCounts: Record<string, number> = {}
    earned?.forEach((e) => {
      earningCounts[e.badgeDefinitionId] = (earningCounts[e.badgeDefinitionId] || 0) + 1
    })

    // Get total org members for earning rate calculation
    const { count: totalMembers } = await supabase
      .from("Membership")
      .select("*", { count: "exact", head: true })
      .eq("orgId", org.orgId)

    const enriched = (badges || []).map((b) => ({
      ...b,
      timesEarned: earningCounts[b.id] || 0,
      earningRate: totalMembers && totalMembers > 0
        ? Math.round(((earningCounts[b.id] || 0) / totalMembers) * 100)
        : 0,
    }))

    return NextResponse.json({ badges: enriched })
  } catch (error) {
    console.error("Admin badges error:", error)
    return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 })
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
    const validated = validateBody(createBadgeSchema, body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from("BadgeDefinition")
      .select("id")
      .eq("orgId", org.orgId)
      .eq("slug", validated.data.slug)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Badge slug already exists" }, { status: 409 })
    }

    const { data: badge, error } = await supabase
      .from("BadgeDefinition")
      .insert({
        orgId: org.orgId,
        ...validated.data,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(badge, { status: 201 })
  } catch (error) {
    console.error("Create badge error:", error)
    return NextResponse.json({ error: "Failed to create badge" }, { status: 500 })
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
    const validated = validateBody(updateBadgeSchema, body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const { id, ...updates } = validated.data
    const { data: badge, error } = await supabase
      .from("BadgeDefinition")
      .update(updates)
      .eq("id", id)
      .eq("orgId", org.orgId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(badge)
  } catch (error) {
    console.error("Update badge error:", error)
    return NextResponse.json({ error: "Failed to update badge" }, { status: 500 })
  }
}
