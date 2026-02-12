import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { z } from "zod"
import { validateBody } from "@/lib/validations"
import { grantXp } from "@/lib/rewards/xp"
import { logRewardsActivity } from "@/lib/rewards/activity"
import { format, startOfWeek } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { getRequestTimezone } from "@/lib/validations"

const sendKudosSchema = z.object({
  toUserId: z.string().min(1),
  category: z.enum([
    "team_player", "always_on_time", "goes_above", "helpful",
    "positive_energy", "problem_solver", "mentor", "custom",
  ]),
  message: z.string().max(500).optional(),
  isAnonymous: z.boolean().default(false),
})

// GET /api/rewards/kudos — Received and given kudos
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 403 })

    const searchParams = request.nextUrl.searchParams
    const tab = searchParams.get("tab") || "received"

    const userId = user!.id
    const orgId = org.orgId

    if (tab === "received") {
      const { data } = await supabase
        .from("Kudos")
        .select("*, fromUser:Membership!Kudos_fromUserId_fkey(userId)")
        .eq("toUserId", userId)
        .eq("orgId", orgId)
        .order("createdAt", { ascending: false })
        .limit(50)

      return NextResponse.json({ kudos: data || [] })
    } else {
      const { data } = await supabase
        .from("Kudos")
        .select("*")
        .eq("fromUserId", userId)
        .eq("orgId", orgId)
        .order("createdAt", { ascending: false })
        .limit(50)

      return NextResponse.json({ kudos: data || [] })
    }
  } catch (error) {
    console.error("Kudos error:", error)
    return NextResponse.json({ error: "Failed to fetch kudos" }, { status: 500 })
  }
}

// POST /api/rewards/kudos — Send kudos
export async function POST(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 403 })

    const body = await request.json()
    const validation = validateBody(sendKudosSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const userId = user!.id
    const orgId = org.orgId
    const { toUserId, category, message, isAnonymous } = validation.data

    // Can't kudos yourself
    if (toUserId === userId) {
      return NextResponse.json({ error: "Cannot send kudos to yourself" }, { status: 400 })
    }

    // Check recipient is in same org
    const { data: recipientMembership } = await supabase
      .from("Membership")
      .select("userId")
      .eq("userId", toUserId)
      .eq("orgId", orgId)
      .single()

    if (!recipientMembership) {
      return NextResponse.json({ error: "Recipient not found in organization" }, { status: 404 })
    }

    // Check weekly budget
    const timezone = getRequestTimezone(request)
    const zonedNow = toZonedTime(new Date(), timezone)
    const weekStart = format(startOfWeek(zonedNow, { weekStartsOn: 1 }), "yyyy-MM-dd")

    const { count: sentThisWeek } = await supabase
      .from("Kudos")
      .select("id", { count: "exact", head: true })
      .eq("fromUserId", userId)
      .eq("orgId", orgId)
      .eq("weekOf", weekStart)

    // Get org budget setting
    const { data: orgData } = await supabase
      .from("Organization")
      .select("features")
      .eq("id", orgId)
      .single()

    const budget = (orgData?.features as Record<string, unknown>)?.kudosBudgetPerWeek as number || 5

    if ((sentThisWeek || 0) >= budget) {
      return NextResponse.json({ error: "Weekly kudos budget reached", budget, sent: sentThisWeek }, { status: 400 })
    }

    // Send kudos
    const { data: kudos, error } = await supabase
      .from("Kudos")
      .insert({
        orgId,
        fromUserId: userId,
        toUserId,
        category,
        message: message || null,
        isAnonymous,
        weekOf: weekStart,
      })
      .select("*")
      .single()

    if (error) {
      console.error("Kudos insert error:", error)
      return NextResponse.json({ error: "Failed to send kudos" }, { status: 500 })
    }

    // Grant XP: 15 to receiver, 5 to giver
    await Promise.all([
      grantXp(toUserId, orgId, 15, "KUDOS_RECEIVED", {
        sourceType: "kudos",
        sourceId: kudos.id,
        skipMultiplier: true,
      }),
      grantXp(userId, orgId, 5, "KUDOS_GIVEN", {
        sourceType: "kudos",
        sourceId: kudos.id,
        skipMultiplier: true,
      }),
    ])

    await logRewardsActivity(orgId, userId, "kudos_given",
      isAnonymous
        ? `Someone sent kudos to a teammate`
        : `Sent kudos: ${category.replace(/_/g, " ")}`,
      { category, toUserId: isAnonymous ? undefined : toUserId }
    )

    return NextResponse.json({
      kudos,
      remaining: budget - (sentThisWeek || 0) - 1,
    })
  } catch (error) {
    console.error("Send kudos error:", error)
    return NextResponse.json({ error: "Failed to send kudos" }, { status: 500 })
  }
}
