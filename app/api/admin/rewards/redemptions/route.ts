import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { z } from "zod/v4"
import { validateBody } from "@/lib/validations"

const updateRedemptionSchema = z.object({
  id: z.string(),
  status: z.enum(["approved", "fulfilled", "rejected"]),
})

export async function GET(request: NextRequest) {
  const { org, user, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") || "pending"

  try {
    let query = supabase
      .from("Redemption")
      .select("*, shopItem:RewardShopItem(*)")
      .eq("orgId", org.orgId)
      .order("createdAt", { ascending: false })
      .limit(50)

    if (status !== "all") {
      query = query.eq("status", status)
    }

    const { data: redemptions, error } = await query

    if (error) throw error

    // Get user names for display
    const userIds = [...new Set(redemptions?.map((r) => r.userId) || [])]
    const { data: members } = await supabase
      .from("Membership")
      .select("userId, User:userId(name, email)")
      .eq("orgId", org.orgId)
      .in("userId", userIds)

    const userMap: Record<string, string> = {}
    members?.forEach((m: { userId: string; User: Array<{ name: string; email: string }> }) => {
      const u = m.User?.[0]
      userMap[m.userId] = u?.name || u?.email || "Unknown"
    })

    const enriched = (redemptions || []).map((r) => ({
      ...r,
      userName: userMap[r.userId] || "Unknown",
    }))

    return NextResponse.json({ redemptions: enriched })
  } catch (error) {
    console.error("Admin redemptions error:", error)
    return NextResponse.json({ error: "Failed to fetch redemptions" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const { org, user, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const validated = validateBody(updateRedemptionSchema, body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const { id, status } = validated.data

    const updateData: Record<string, unknown> = { status }
    if (status === "approved" || status === "fulfilled") {
      updateData.approvedBy = user!.id
    }

    // If rejecting, refund the coins and restore stock
    if (status === "rejected") {
      const { data: redemption } = await supabase
        .from("Redemption")
        .select("userId, costCoins, shopItemId")
        .eq("id", id)
        .eq("orgId", org.orgId)
        .single()

      if (redemption) {
        // Refund coins
        const { data: profile } = await supabase
          .from("RewardsProfile")
          .select("coins")
          .eq("userId", redemption.userId)
          .eq("orgId", org.orgId)
          .single()

        if (profile) {
          await supabase
            .from("RewardsProfile")
            .update({ coins: profile.coins + redemption.costCoins })
            .eq("userId", redemption.userId)
            .eq("orgId", org.orgId)
        }

        // Restore stock if applicable
        const { data: item } = await supabase
          .from("RewardShopItem")
          .select("stock")
          .eq("id", redemption.shopItemId)
          .single()

        if (item && item.stock !== null) {
          await supabase
            .from("RewardShopItem")
            .update({ stock: item.stock + 1 })
            .eq("id", redemption.shopItemId)
        }
      }
    }

    const { data: updated, error } = await supabase
      .from("Redemption")
      .update(updateData)
      .eq("id", id)
      .eq("orgId", org.orgId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update redemption error:", error)
    return NextResponse.json({ error: "Failed to update redemption" }, { status: 500 })
  }
}
