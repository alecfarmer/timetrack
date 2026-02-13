import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// GET /api/admin/shifts/swaps — List all swap requests for the org
export async function GET(request: NextRequest) {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const { searchParams } = request.nextUrl
  const status = searchParams.get("status")

  let query = supabase
    .from("ShiftSwapRequest")
    .select("*")
    .eq("orgId", org.orgId)
    .order("createdAt", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}

// PUT /api/admin/shifts/swaps — Admin approve or reject a swap
export async function PUT(request: NextRequest) {
  const { user, org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const body = await request.json()
  const { swapId, action } = body

  if (!swapId || !action) {
    return NextResponse.json({ error: "swapId and action are required" }, { status: 400 })
  }

  if (action !== "approved" && action !== "rejected") {
    return NextResponse.json({ error: "action must be 'approved' or 'rejected'" }, { status: 400 })
  }

  // Fetch the swap
  const { data: swap } = await supabase
    .from("ShiftSwapRequest")
    .select("*")
    .eq("id", swapId)
    .eq("orgId", org.orgId)
    .single()

  if (!swap) {
    return NextResponse.json({ error: "Swap request not found" }, { status: 404 })
  }

  if (swap.status !== "accepted" && swap.status !== "pending") {
    return NextResponse.json(
      { error: `Cannot ${action} a swap with status '${swap.status}'` },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from("ShiftSwapRequest")
    .update({
      status: action === "approved" ? "completed" : "rejected",
      adminApprovedBy: user.id,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", swapId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If approved and both assignments exist, swap the shift assignments
  if (action === "approved" && swap.targetAssignmentId) {
    // Get both assignments
    const { data: assignments } = await supabase
      .from("ShiftAssignment")
      .select("id, userId, shiftId")
      .in("id", [swap.assignmentId, swap.targetAssignmentId])

    if (assignments && assignments.length === 2) {
      const a1 = assignments.find((a: { id: string }) => a.id === swap.assignmentId)
      const a2 = assignments.find((a: { id: string }) => a.id === swap.targetAssignmentId)

      if (a1 && a2) {
        // Swap the userIds on the assignments
        await Promise.all([
          supabase.from("ShiftAssignment").update({ userId: a2.userId }).eq("id", a1.id),
          supabase.from("ShiftAssignment").update({ userId: a1.userId }).eq("id", a2.id),
        ])
      }
    }
  }

  return NextResponse.json({ status: action === "approved" ? "completed" : "rejected" })
}
