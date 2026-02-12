import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// GET /api/rewards/feed — Paginated org-wide activity feed
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 403 })

    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const offset = parseInt(searchParams.get("offset") || "0")

    const { data: activities, count } = await supabase
      .from("RewardsActivity")
      .select("*", { count: "exact" })
      .eq("orgId", org.orgId)
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1)

    return NextResponse.json({
      activities: activities || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Feed error:", error)
    return NextResponse.json({ error: "Failed to fetch activity feed" }, { status: 500 })
  }
}
