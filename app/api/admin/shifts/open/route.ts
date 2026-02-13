import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// POST /api/admin/shifts/open — Post an open shift
export async function POST(request: NextRequest) {
  const { user, org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const body = await request.json()
  const { shiftId, date } = body

  if (!shiftId || !date) {
    return NextResponse.json({ error: "shiftId and date are required" }, { status: 400 })
  }

  // Verify shift belongs to this org
  const { data: shift } = await supabase
    .from("Shift")
    .select("id, orgId")
    .eq("id", shiftId)
    .eq("orgId", org.orgId)
    .single()

  if (!shift) {
    return NextResponse.json({ error: "Shift not found" }, { status: 404 })
  }

  const { data: openShift, error } = await supabase
    .from("OpenShift")
    .insert({
      shiftId,
      date,
      postedBy: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(openShift, { status: 201 })
}
