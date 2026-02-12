import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { z } from "zod/v4"
import { validateBody } from "@/lib/validations"

const createShopItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(10).default("🎁"),
  costCoins: z.number().int().min(1),
  category: z.enum(["perk", "swag", "time_off", "recognition"]),
  stock: z.number().int().min(0).nullable().optional(),
  maxPerUser: z.number().int().min(1).nullable().optional(),
  isActive: z.boolean().default(true),
})

const updateShopItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  icon: z.string().max(10).optional(),
  costCoins: z.number().int().min(1).optional(),
  category: z.enum(["perk", "swag", "time_off", "recognition"]).optional(),
  stock: z.number().int().min(0).nullable().optional(),
  maxPerUser: z.number().int().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  try {
    const { data: items, error } = await supabase
      .from("RewardShopItem")
      .select("*")
      .eq("orgId", org.orgId)
      .order("createdAt", { ascending: false })

    if (error) throw error

    // Get redemption counts per item
    const { data: redemptions } = await supabase
      .from("Redemption")
      .select("shopItemId")
      .eq("orgId", org.orgId)

    const redemptionCounts: Record<string, number> = {}
    redemptions?.forEach((r) => {
      redemptionCounts[r.shopItemId] = (redemptionCounts[r.shopItemId] || 0) + 1
    })

    const enrichedItems = (items || []).map((item) => ({
      ...item,
      totalRedemptions: redemptionCounts[item.id] || 0,
    }))

    return NextResponse.json({ items: enrichedItems })
  } catch (error) {
    console.error("Admin shop items error:", error)
    return NextResponse.json({ error: "Failed to fetch shop items" }, { status: 500 })
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
    const validated = validateBody(createShopItemSchema, body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const { data: item, error } = await supabase
      .from("RewardShopItem")
      .insert({
        orgId: org.orgId,
        ...validated.data,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("Create shop item error:", error)
    return NextResponse.json({ error: "Failed to create shop item" }, { status: 500 })
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
    const validated = validateBody(updateShopItemSchema, body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const { id, ...updates } = validated.data
    const { data: item, error } = await supabase
      .from("RewardShopItem")
      .update(updates)
      .eq("id", id)
      .eq("orgId", org.orgId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(item)
  } catch (error) {
    console.error("Update shop item error:", error)
    return NextResponse.json({ error: "Failed to update shop item" }, { status: 500 })
  }
}
