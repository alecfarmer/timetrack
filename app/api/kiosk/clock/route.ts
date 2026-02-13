import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"

// POST /api/kiosk/clock — Clock in/out via kiosk token + user email/PIN
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { token, email, action } = body

  if (!token || !email || !action) {
    return NextResponse.json(
      { error: "token, email, and action are required" },
      { status: 400 }
    )
  }

  if (action !== "clock-in" && action !== "clock-out") {
    return NextResponse.json(
      { error: 'action must be "clock-in" or "clock-out"' },
      { status: 400 }
    )
  }

  // Validate kiosk session
  const { data: session } = await supabase
    .from("KioskSession")
    .select(`
      id, orgId, locationId, isActive, expiresAt,
      location:Location (id, name, latitude, longitude)
    `)
    .eq("token", token)
    .eq("isActive", true)
    .single()

  if (!session) {
    return NextResponse.json({ error: "Invalid or expired kiosk session" }, { status: 401 })
  }

  if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Kiosk session has expired" }, { status: 401 })
  }

  // Find user by email in this org
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const authUser = authUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  )

  if (!authUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Verify user is member of this org
  const { data: membership } = await supabase
    .from("Membership")
    .select("id, role")
    .eq("userId", authUser.id)
    .eq("orgId", session.orgId)
    .single()

  if (!membership) {
    return NextResponse.json({ error: "User is not a member of this organization" }, { status: 403 })
  }

  const now = new Date()
  const today = now.toISOString().split("T")[0]
  const location = Array.isArray(session.location) ? session.location[0] : session.location

  if (action === "clock-in") {
    // Check for existing active session
    const { data: existing } = await supabase
      .from("TimeEntry")
      .select("id")
      .eq("userId", authUser.id)
      .is("clockOut", null)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "Already clocked in" }, { status: 409 })
    }

    // Create time entry
    const { data: entry, error } = await supabase
      .from("TimeEntry")
      .insert({
        userId: authUser.id,
        orgId: session.orgId,
        locationId: session.locationId,
        locationName: location?.name || "Kiosk",
        clockIn: now.toISOString(),
        date: today,
        type: "ONSITE",
        source: "KIOSK",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      action: "clock-in",
      entry,
      message: `Clocked in at ${location?.name || "Kiosk"}`,
    })
  }

  // Clock out
  const { data: activeEntry } = await supabase
    .from("TimeEntry")
    .select("id, clockIn")
    .eq("userId", authUser.id)
    .is("clockOut", null)
    .order("clockIn", { ascending: false })
    .limit(1)
    .single()

  if (!activeEntry) {
    return NextResponse.json({ error: "Not currently clocked in" }, { status: 400 })
  }

  const clockInTime = new Date(activeEntry.clockIn)
  const totalMinutes = Math.round((now.getTime() - clockInTime.getTime()) / 60000)

  const { data: entry, error } = await supabase
    .from("TimeEntry")
    .update({
      clockOut: now.toISOString(),
      totalMinutes,
    })
    .eq("id", activeEntry.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    action: "clock-out",
    entry,
    message: `Clocked out. Total: ${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
  })
}
