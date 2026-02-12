import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

interface ActivityEvent {
  id: string
  userId: string
  userName: string
  userEmail: string
  type: "CLOCK_IN" | "CLOCK_OUT" | "BREAK_START" | "BREAK_END"
  locationName: string
  timestamp: string
}

// GET /api/admin/activity - Get recent activity for the organization
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org || org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "20")
    const locationId = searchParams.get("locationId")

    // Get all org members with names
    const { data: members } = await supabase
      .from("Membership")
      .select("userId, firstName, lastName")
      .eq("orgId", org.orgId)

    if (!members || members.length === 0) {
      return NextResponse.json({ activity: [] })
    }

    const memberIds = members.map((m) => m.userId)

    // Build query for recent entries
    let query = supabase
      .from("Entry")
      .select(`
        id,
        userId,
        type,
        timestampServer,
        location:Location (id, name)
      `)
      .in("userId", memberIds)
      .order("timestampServer", { ascending: false })
      .limit(limit)

    if (locationId) {
      query = query.eq("locationId", locationId)
    }

    const { data: entries, error } = await query

    if (error) {
      console.error("Error fetching activity:", error)
      return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 })
    }

    // Build name map from membership data
    const nameMap = new Map<string, string>()
    for (const m of members) {
      const name = [m.firstName, m.lastName].filter(Boolean).join(" ")
      if (name) nameMap.set(m.userId, name)
    }

    // Get emails from auth admin API
    const emailMap: Record<string, string> = {}
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    if (authData?.users) {
      for (const u of authData.users) {
        if (memberIds.includes(u.id)) {
          emailMap[u.id] = u.email || u.id
        }
      }
    }

    // Transform to activity events
    const activity: ActivityEvent[] = (entries || []).map((entry) => {
      const location = Array.isArray(entry.location) ? entry.location[0] : entry.location

      return {
        id: entry.id,
        userId: entry.userId,
        userName: nameMap.get(entry.userId) || "Team Member",
        userEmail: emailMap[entry.userId] || "",
        type: entry.type,
        locationName: location?.name || "Unknown",
        timestamp: entry.timestampServer,
      }
    })

    return NextResponse.json({ activity })
  } catch (error) {
    console.error("Error fetching activity:", error)
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 })
  }
}
