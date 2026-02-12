import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { z } from "zod"
import { validateBody } from "@/lib/validations"
import { logRewardsActivity } from "@/lib/rewards/activity"

const redeemSchema = z.object({
  shopItemId: z.string().min(1),
})

// POST /api/rewards/shop/redeem — Redeem a shop item
export async function POST(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 403 })

    const body = await request.json()
    const validation = validateBody(redeemSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const userId = user!.id
    const orgId = org.orgId

    // Fetch item and profile
    const [itemResult, profileResult] = await Promise.all([
      supabase
        .from("RewardShopItem")
        .select("*")
        .eq("id", validation.data.shopItemId)
        .eq("orgId", orgId)
        .eq("isActive", true)
        .single(),

      supabase
        .from("RewardsProfile")
        .select("id, coins")
        .eq("userId", userId)
        .eq("orgId", orgId)
        .single(),
    ])

    const item = itemResult.data
    const profile = profileResult.data

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 })
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

    // Check coin balance
    if (profile.coins < item.costCoins) {
      return NextResponse.json({ error: "Not enough coins", required: item.costCoins, available: profile.coins }, { status: 400 })
    }

    // Check stock
    if (item.stock !== null && item.stock <= 0) {
      return NextResponse.json({ error: "Item out of stock" }, { status: 400 })
    }

    // Check per-user limit
    if (item.maxPerUser) {
      const { count } = await supabase
        .from("Redemption")
        .select("id", { count: "exact", head: true })
        .eq("userId", userId)
        .eq("shopItemId", item.id)
        .neq("status", "rejected")

      if ((count || 0) >= item.maxPerUser) {
        return NextResponse.json({ error: "Purchase limit reached" }, { status: 400 })
      }
    }

    // Deduct coins
    await supabase
      .from("RewardsProfile")
      .update({ coins: profile.coins - item.costCoins, updatedAt: new Date().toISOString() })
      .eq("id", profile.id)

    // Decrement stock if applicable
    if (item.stock !== null) {
      await supabase
        .from("RewardShopItem")
        .update({ stock: item.stock - 1, updatedAt: new Date().toISOString() })
        .eq("id", item.id)
    }

    // Create redemption
    const { data: redemption } = await supabase
      .from("Redemption")
      .insert({
        userId,
        orgId,
        shopItemId: item.id,
        costCoins: item.costCoins,
        costXp: item.costXp,
        status: "pending",
      })
      .select("*")
      .single()

    await logRewardsActivity(orgId, userId, "shop_redemption", `Redeemed "${item.name}"`, {
      itemId: item.id,
      itemName: item.name,
      costCoins: item.costCoins,
    })

    return NextResponse.json({
      redemption,
      coins: profile.coins - item.costCoins,
    })
  } catch (error) {
    console.error("Redeem error:", error)
    return NextResponse.json({ error: "Failed to redeem item" }, { status: 500 })
  }
}
