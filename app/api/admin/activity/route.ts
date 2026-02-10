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

    // Get all org members
    const { data: members } = await supabase
      .from("Membership")
      .select("userId")
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

    // Get user emails for display
    const { data: userMemberships } = await supabase
      .from("Membership")
      .select("userId, user:User(email, name)")
      .in("userId", memberIds)

    const userMap = new Map<string, { email: string; name: string | null }>()
    for (const m of userMemberships || []) {
      const userData = Array.isArray(m.user) ? m.user[0] : m.user
      if (userData) {
        userMap.set(m.userId, {
          email: userData.email || "",
          name: userData.name || null
        })
      }
    }

    // Transform to activity events
    const activity: ActivityEvent[] = (entries || []).map((entry) => {
      const location = Array.isArray(entry.location) ? entry.location[0] : entry.location
      const userData = userMap.get(entry.userId)

      return {
        id: entry.id,
        userId: entry.userId,
        userName: userData?.name || "Team Member",
        userEmail: userData?.email || "",
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
