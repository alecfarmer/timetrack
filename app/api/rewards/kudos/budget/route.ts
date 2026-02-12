import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { getRequestTimezone } from "@/lib/validations"
import { format, startOfWeek } from "date-fns"
import { toZonedTime } from "date-fns-tz"

// GET /api/rewards/kudos/budget — Remaining weekly kudos budget
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 403 })

    const timezone = getRequestTimezone(request)
    const zonedNow = toZonedTime(new Date(), timezone)
    const weekStart = format(startOfWeek(zonedNow, { weekStartsOn: 1 }), "yyyy-MM-dd")

    const [sentResult, orgResult] = await Promise.all([
      supabase
        .from("Kudos")
        .select("id", { count: "exact", head: true })
        .eq("fromUserId", user!.id)
        .eq("orgId", org.orgId)
        .eq("weekOf", weekStart),

      supabase
        .from("Organization")
        .select("features")
        .eq("id", org.orgId)
        .single(),
    ])

    const budget = (orgResult.data?.features as Record<string, unknown>)?.kudosBudgetPerWeek as number || 5
    const sent = sentResult.count || 0

    return NextResponse.json({
      budget,
      sent,
      remaining: Math.max(0, budget - sent),
    })
  } catch (error) {
    console.error("Kudos budget error:", error)
    return NextResponse.json({ error: "Failed to fetch kudos budget" }, { status: 500 })
  }
}
