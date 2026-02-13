import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { generateSchedule } from "@/lib/scheduling"

// GET /api/admin/shifts/auto-schedule — Preview auto-generated schedule
export async function GET(request: NextRequest) {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const weekStart = request.nextUrl.searchParams.get("weekStart")
  if (!weekStart) {
    return NextResponse.json({ error: "weekStart is required" }, { status: 400 })
  }

  // Fetch shifts, members, and availability
  const [shiftsRes, membersRes, availabilityRes, existingRes] = await Promise.all([
    supabase.from("Shift").select("*").eq("orgId", org.orgId).eq("isActive", true),
    supabase.from("Membership").select("userId, firstName, lastName, role").eq("orgId", org.orgId),
    supabase.from("EmployeeAvailability").select("*").eq("orgId", org.orgId),
    supabase.from("ShiftAssignment").select("*").is("endDate", null),
  ])

  if (shiftsRes.error || membersRes.error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }

  const shifts = shiftsRes.data || []
  const members = (membersRes.data || []).filter((m) => m.role === "MEMBER" || m.role === "ADMIN")
  const availability = availabilityRes.data || []
  const existingAssignments = existingRes.data || []

  const schedule = generateSchedule({
    weekStart,
    shifts,
    members,
    availability,
    existingAssignments,
  })

  return NextResponse.json(schedule)
}

// POST /api/admin/shifts/auto-schedule — Publish auto-generated schedule
export async function POST(request: NextRequest) {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const body = await request.json()
  const { assignments } = body

  if (!Array.isArray(assignments) || assignments.length === 0) {
    return NextResponse.json({ error: "assignments array is required" }, { status: 400 })
  }

  // Create shift assignments
  const rows = assignments.map((a: { shiftId: string; userId: string; effectiveDate: string }) => ({
    shiftId: a.shiftId,
    userId: a.userId,
    effectiveDate: a.effectiveDate,
  }))

  const { data, error } = await supabase
    .from("ShiftAssignment")
    .insert(rows)
    .select(`*, shift:Shift (id, name, startTime, endTime, color)`)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ published: data?.length || 0, assignments: data }, { status: 201 })
}
