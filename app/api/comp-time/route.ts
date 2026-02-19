import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// GET /api/comp-time - Get user's comp time balance and history
export async function GET() {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 403 })
    }

    // First, expire any old entries
    try {
      await supabase.rpc("expire_comp_time_entries")
    } catch {
      // Function may not exist yet, continue anyway
    }

    // Fetch all comp time entries for user
    const { data: entries, error } = await supabase
      .from("CompTimeEntry")
      .select("*")
      .eq("userId", user!.id)
      .order("sourceDate", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to fetch comp time", details: error.message },
        { status: 500 }
      )
    }

    // Calculate balance
    const available = (entries || []).filter(
      (e) => e.status === "AVAILABLE" || e.status === "PARTIALLY_USED"
    )
    const totalAvailableMinutes = available.reduce(
      (sum, e) => sum + (e.minutesEarned - e.minutesUsed),
      0
    )

    // Find entries expiring soon (within 14 days)
    const twoWeeksFromNow = new Date()
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14)
    const expiringSoon = available.filter(
      (e) => new Date(e.expiresAt) <= twoWeeksFromNow
    )
    const expiringMinutes = expiringSoon.reduce(
      (sum, e) => sum + (e.minutesEarned - e.minutesUsed),
      0
    )

    return NextResponse.json({
      entries: entries || [],
      balance: {
        totalMinutes: totalAvailableMinutes,
        availableHours: Math.floor(totalAvailableMinutes / 60),
        availableRemainingMinutes: totalAvailableMinutes % 60,
        expiringMinutes,
        expiringHours: Math.floor(expiringMinutes / 60),
        expiringWithin: 14,
      },
    })
  } catch (error) {
    console.error("Error fetching comp time:", error)
    return NextResponse.json(
      { error: "Failed to fetch comp time" },
      { status: 500 }
    )
  }
}

// POST /api/comp-time - Admin: manually grant comp time
export async function POST(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org || org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, minutesEarned, description, sourceDate } = body

    if (!userId || !minutesEarned || minutesEarned <= 0) {
      return NextResponse.json(
        { error: "userId and minutesEarned (> 0) are required" },
        { status: 400 }
      )
    }

    // Create manual comp time entry
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 90)

    const { data: entry, error } = await supabase
      .from("CompTimeEntry")
      .insert({
        userId,
        orgId: org.orgId,
        type: "MANUAL",
        sourceDate: sourceDate || new Date().toISOString().split("T")[0],
        minutesEarned,
        description: description || "Manual grant by admin",
        expiresAt: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to create comp time entry", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error("Error creating comp time:", error)
    return NextResponse.json(
      { error: "Failed to create comp time entry" },
      { status: 500 }
    )
  }
}
