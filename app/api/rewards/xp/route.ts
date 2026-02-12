import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// GET /api/rewards/xp — Paginated XP history from ledger
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 403 })

    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100)
    const offset = parseInt(searchParams.get("offset") || "0")

    const { data: entries, count, error } = await supabase
      .from("XpLedger")
      .select("*", { count: "exact" })
      .eq("userId", user!.id)
      .eq("orgId", org.orgId)
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("XP ledger error:", error)
      return NextResponse.json({ error: "Failed to fetch XP history" }, { status: 500 })
    }

    return NextResponse.json({
      entries: entries || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("XP history error:", error)
    return NextResponse.json({ error: "Failed to fetch XP history" }, { status: 500 })
  }
}
