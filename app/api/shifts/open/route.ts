import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// GET /api/shifts/open — List available open shifts
export async function GET(request: NextRequest) {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 })
  }

  const { data, error } = await supabase
    .from("OpenShift")
    .select(`
      *,
      shift:Shift (id, name, startTime, endTime, color)
    `)
    .is("claimedBy", null)
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Filter to only shifts belonging to user's org
  const orgShifts = (data || []).filter((os: { shift: { id: string } | { id: string }[] | null }) => {
    // The join may be array or object
    return os.shift !== null
  })

  return NextResponse.json(orgShifts)
}

// POST /api/shifts/open — Claim an open shift
export async function POST(request: NextRequest) {
  const { user, org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 })
  }

  const body = await request.json()
  const { openShiftId } = body

  if (!openShiftId) {
    return NextResponse.json({ error: "openShiftId is required" }, { status: 400 })
  }

  // Attempt to claim (only if not already claimed)
  const { data, error } = await supabase
    .from("OpenShift")
    .update({
      claimedBy: user.id,
      claimedAt: new Date().toISOString(),
    })
    .eq("id", openShiftId)
    .is("claimedBy", null)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: "Shift already claimed or not found" },
      { status: 409 }
    )
  }

  return NextResponse.json(data)
}
