import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// GET /api/availability — Get current user's availability
export async function GET(request: NextRequest) {
  const { user, org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 })
  }

  const userId = request.nextUrl.searchParams.get("userId") || user.id

  // Non-admins can only see their own
  if (userId !== user.id && org.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data, error } = await supabase
    .from("EmployeeAvailability")
    .select("*")
    .eq("userId", userId)
    .eq("orgId", org.orgId)
    .order("dayOfWeek", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}

// POST /api/availability — Set availability for a day
export async function POST(request: NextRequest) {
  const { user, org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 })
  }

  const body = await request.json()
  const { availability } = body

  if (!Array.isArray(availability)) {
    return NextResponse.json({ error: "availability array is required" }, { status: 400 })
  }

  // Validate each entry
  for (const entry of availability) {
    if (entry.dayOfWeek === undefined || entry.dayOfWeek < 0 || entry.dayOfWeek > 6) {
      return NextResponse.json({ error: "Invalid dayOfWeek (0-6)" }, { status: 400 })
    }
    if (entry.preference && !["preferred", "available", "unavailable"].includes(entry.preference)) {
      return NextResponse.json({ error: "Invalid preference" }, { status: 400 })
    }
  }

  const today = new Date().toISOString().split("T")[0]

  // Upsert all entries
  const rows = availability.map((entry: {
    dayOfWeek: number
    startTime?: string
    endTime?: string
    isAvailable?: boolean
    preference?: string
  }) => ({
    userId: user.id,
    orgId: org.orgId,
    dayOfWeek: entry.dayOfWeek,
    startTime: entry.startTime || null,
    endTime: entry.endTime || null,
    isAvailable: entry.isAvailable ?? entry.preference !== "unavailable",
    preference: entry.preference || "available",
    effectiveDate: today,
    updatedAt: new Date().toISOString(),
  }))

  const { data, error } = await supabase
    .from("EmployeeAvailability")
    .upsert(rows, { onConflict: "userId,orgId,dayOfWeek,effectiveDate" })
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
