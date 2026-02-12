import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// GET /api/rewards/shop — Available shop items
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 403 })

    const [itemsResult, profileResult, redemptionsResult] = await Promise.all([
      supabase
        .from("RewardShopItem")
        .select("*")
        .eq("orgId", org.orgId)
        .eq("isActive", true)
        .order("costCoins", { ascending: true }),

      supabase
        .from("RewardsProfile")
        .select("coins")
        .eq("userId", user!.id)
        .eq("orgId", org.orgId)
        .single(),

      supabase
        .from("Redemption")
        .select("shopItemId, status")
        .eq("userId", user!.id)
        .eq("orgId", org.orgId),
    ])

    // Count user's redemptions per item
    const redemptionCounts = new Map<string, number>()
    for (const r of redemptionsResult.data || []) {
      if (r.status !== "rejected") {
        redemptionCounts.set(r.shopItemId, (redemptionCounts.get(r.shopItemId) || 0) + 1)
      }
    }

    const items = (itemsResult.data || []).map((item) => ({
      ...item,
      userRedemptions: redemptionCounts.get(item.id) || 0,
      canPurchase: (profileResult.data?.coins || 0) >= item.costCoins &&
        (!item.maxPerUser || (redemptionCounts.get(item.id) || 0) < item.maxPerUser) &&
        (item.stock === null || item.stock > 0),
    }))

    return NextResponse.json({
      items,
      coins: profileResult.data?.coins || 0,
    })
  } catch (error) {
    console.error("Shop error:", error)
    return NextResponse.json({ error: "Failed to fetch shop items" }, { status: 500 })
  }
}
