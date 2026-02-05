import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { startOfDay, endOfDay } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { getRequestTimezone } from "@/lib/validations"

interface TeamMemberOnSite {
  userId: string
  name: string
  email: string
  locationName: string
  clockedInAt: string
  avatarUrl?: string
}

// GET /api/team/on-site - Get team members currently clocked in
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 })
    }

    const timezone = getRequestTimezone(request)
    const now = new Date()
    const zonedNow = toZonedTime(now, timezone)
    const todayStart = startOfDay(zonedNow)
    const todayEnd = endOfDay(zonedNow)

    // Get all org members
    const { data: members } = await supabase
      .from("Membership")
      .select("userId")
      .eq("orgId", org.orgId)

    if (!members || members.length === 0) {
      return NextResponse.json({ onSite: [], count: 0 })
    }

    const memberIds = members.map((m) => m.userId)

    // Get today's entries for all org members, ordered by time desc
    const { data: entries, error } = await supabase
      .from("Entry")
      .select(`
        id,
        userId,
        type,
        timestampServer,
        location:Location (id, name)
      `)
      .in("userId", memberIds)
      .gte("timestampServer", todayStart.toISOString())
      .lte("timestampServer", todayEnd.toISOString())
      .order("timestampServer", { ascending: false })

    if (error) {
      console.error("Error fetching entries:", error)
      return NextResponse.json({ error: "Failed to fetch on-site data" }, { status: 500 })
    }

    // Determine who is currently clocked in
    // For each user, find their most recent entry - if it's CLOCK_IN, they're on-site
    const userLatestEntry = new Map<string, typeof entries[0]>()

    for (const entry of (entries || [])) {
      if (!userLatestEntry.has(entry.userId)) {
        userLatestEntry.set(entry.userId, entry)
      }
    }

    // Filter to only users whose latest entry is CLOCK_IN
    const clockedInUserIds = Array.from(userLatestEntry.entries())
      .filter(([_, entry]) => entry.type === "CLOCK_IN")
      .map(([userId, _]) => userId)

    if (clockedInUserIds.length === 0) {
      return NextResponse.json({ onSite: [], count: 0 })
    }

    // Get user details from auth.users
    const { data: users } = await supabase
      .from("auth.users")
      .select("id, email, raw_user_meta_data")
      .in("id", clockedInUserIds)

    // Build the on-site list
    const onSite: TeamMemberOnSite[] = []

    for (const userId of clockedInUserIds) {
      const entry = userLatestEntry.get(userId)!
      const location = Array.isArray(entry.location) ? entry.location[0] : entry.location

      // Try to get user info - fallback to just the entry data if user lookup fails
      let name = "Team Member"
      let email = ""
      let avatarUrl: string | undefined

      // Query auth.users directly via RPC or just use email from a different approach
      // Since we can't easily query auth.users, let's use a workaround
      // We'll store the user's name in raw_user_meta_data during signup

      onSite.push({
        userId,
        name,
        email,
        locationName: location?.name || "Unknown Location",
        clockedInAt: entry.timestampServer,
        avatarUrl,
      })
    }

    // Exclude current user from the list (they can see themselves on the dashboard)
    const filteredOnSite = onSite.filter((m) => m.userId !== user!.id)

    return NextResponse.json({
      onSite: filteredOnSite,
      count: filteredOnSite.length,
      totalTeamOnSite: onSite.length,
    })
  } catch (error) {
    console.error("Error fetching on-site data:", error)
    return NextResponse.json({ error: "Failed to fetch on-site data" }, { status: 500 })
  }
}
