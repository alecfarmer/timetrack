import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// GET /api/shifts/assignments - List shift assignments
export async function GET(request: NextRequest) {
  const { user, org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 })
  }

  const { searchParams } = request.nextUrl
  const shiftId = searchParams.get("shiftId")
  const userId = searchParams.get("userId")

  let query = supabase
    .from("ShiftAssignment")
    .select(`
      *,
      shift:Shift (id, name, startTime, endTime, daysOfWeek, color)
    `)
    .is("endDate", null)

  if (shiftId) {
    query = query.eq("shiftId", shiftId)
  }

  // Non-admins can only see their own assignments
  if (org.role !== "ADMIN") {
    query = query.eq("userId", user.id)
  } else if (userId) {
    query = query.eq("userId", userId)
  }

  const { data: assignments, error } = await query.order("effectiveDate", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 })
  }

  return NextResponse.json(assignments || [])
}

// POST /api/shifts/assignments - Assign user to shift (admin only)
export async function POST(request: NextRequest) {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const body = await request.json()
  const { shiftId, userId, effectiveDate } = body

  if (!shiftId || !userId) {
    return NextResponse.json({ error: "shiftId and userId are required" }, { status: 400 })
  }

  // Verify shift belongs to this org
  const { data: shift } = await supabase
    .from("Shift")
    .select("orgId")
    .eq("id", shiftId)
    .eq("orgId", org.orgId)
    .single()

  if (!shift) {
    return NextResponse.json({ error: "Shift not found" }, { status: 404 })
  }

  const { data: assignment, error } = await supabase
    .from("ShiftAssignment")
    .insert({
      shiftId,
      userId,
      effectiveDate: effectiveDate || new Date().toISOString().split("T")[0],
    })
    .select(`
      *,
      shift:Shift (id, name, startTime, endTime, daysOfWeek, color)
    `)
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "User is already assigned to this shift" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 })
  }

  return NextResponse.json(assignment, { status: 201 })
}

// DELETE /api/shifts/assignments - Remove assignment (admin only)
export async function DELETE(request: NextRequest) {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const id = request.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  // End the assignment rather than hard delete
  const { error } = await supabase
    .from("ShiftAssignment")
    .update({ endDate: new Date().toISOString().split("T")[0] })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: "Failed to remove assignment" }, { status: 500 })
  }

  return NextResponse.json({ removed: true })
}
