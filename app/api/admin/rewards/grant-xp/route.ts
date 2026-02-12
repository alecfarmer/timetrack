import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { z } from "zod/v4"
import { validateBody } from "@/lib/validations"
import { grantXp } from "@/lib/rewards/xp"
import { logRewardsActivity } from "@/lib/rewards/activity"

const grantXpSchema = z.object({
  userId: z.string(),
  amount: z.number().int().min(1).max(10000),
  reason: z.string().min(1).max(200),
  grantCoins: z.number().int().min(0).max(10000).default(0),
})

export async function POST(request: NextRequest) {
  const { org, user, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const validated = validateBody(grantXpSchema, body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const { userId, amount, reason, grantCoins } = validated.data

    const result = await grantXp(userId, org.orgId, amount, "ADMIN_GRANT", {
      sourceType: "admin",
      sourceId: user!.id,
      metadata: { adminReason: reason, grantCoins },
    })

    // Grant bonus coins if specified
    if (grantCoins > 0) {
      const { supabaseAdmin: supabase } = await import("@/lib/supabase")
      const { data: profile } = await supabase
        .from("RewardsProfile")
        .select("coins")
        .eq("userId", userId)
        .eq("orgId", org.orgId)
        .single()

      if (profile) {
        await supabase
          .from("RewardsProfile")
          .update({ coins: profile.coins + grantCoins })
          .eq("userId", userId)
          .eq("orgId", org.orgId)
      }
    }

    await logRewardsActivity(
      org.orgId,
      userId,
      "level_up",
      `Received ${amount} XP${grantCoins > 0 ? ` and ${grantCoins} coins` : ""}: ${reason}`,
      { adminId: user!.id, amount, grantCoins },
    )

    return NextResponse.json({
      ...result,
      coinsGranted: grantCoins,
    })
  } catch (error) {
    console.error("Grant XP error:", error)
    return NextResponse.json({ error: "Failed to grant XP" }, { status: 500 })
  }
}
