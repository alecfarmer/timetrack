import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// GET /api/shifts/swap — List swap requests visible to the user
export async function GET(request: NextRequest) {
  const { user, org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 })
  }

  const { searchParams } = request.nextUrl
  const status = searchParams.get("status") || "pending"

  // Get swaps where user is requester OR target
  const { data, error } = await supabase
    .from("ShiftSwapRequest")
    .select("*")
    .eq("orgId", org.orgId)
    .eq("status", status)
    .or(`requesterId.eq.${user.id},targetUserId.eq.${user.id},targetUserId.is.null`)
    .order("createdAt", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}

// POST /api/shifts/swap — Create a swap request
export async function POST(request: NextRequest) {
  const { user, org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 })
  }

  const body = await request.json()
  const { assignmentId, targetUserId, reason } = body

  if (!assignmentId) {
    return NextResponse.json({ error: "assignmentId is required" }, { status: 400 })
  }

  // Verify assignment belongs to the requester
  const { data: assignment } = await supabase
    .from("ShiftAssignment")
    .select("id, shiftId, userId")
    .eq("id", assignmentId)
    .eq("userId", user.id)
    .single()

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found or not yours" }, { status: 404 })
  }

  const { data: swapRequest, error } = await supabase
    .from("ShiftSwapRequest")
    .insert({
      orgId: org.orgId,
      requesterId: user.id,
      assignmentId,
      targetUserId: targetUserId || null,
      reason: reason || null,
      status: "pending",
      requiresAdminApproval: true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(swapRequest, { status: 201 })
}

// PUT /api/shifts/swap — Accept or cancel a swap request
export async function PUT(request: NextRequest) {
  const { user, org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 })
  }

  const body = await request.json()
  const { swapId, action, targetAssignmentId } = body

  if (!swapId || !action) {
    return NextResponse.json({ error: "swapId and action are required" }, { status: 400 })
  }

  // Fetch the swap request
  const { data: swap } = await supabase
    .from("ShiftSwapRequest")
    .select("*")
    .eq("id", swapId)
    .eq("orgId", org.orgId)
    .single()

  if (!swap) {
    return NextResponse.json({ error: "Swap request not found" }, { status: 404 })
  }

  if (action === "cancel") {
    // Only requester can cancel
    if (swap.requesterId !== user.id) {
      return NextResponse.json({ error: "Only requester can cancel" }, { status: 403 })
    }
    const { error } = await supabase
      .from("ShiftSwapRequest")
      .update({ status: "cancelled", updatedAt: new Date().toISOString() })
      .eq("id", swapId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ status: "cancelled" })
  }

  if (action === "accept") {
    // Target user accepts the swap
    if (swap.requesterId === user.id) {
      return NextResponse.json({ error: "Cannot accept your own swap" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {
      targetUserId: user.id,
      status: swap.requiresAdminApproval ? "accepted" : "completed",
      updatedAt: new Date().toISOString(),
    }
    if (targetAssignmentId) {
      updateData.targetAssignmentId = targetAssignmentId
    }

    const { error } = await supabase
      .from("ShiftSwapRequest")
      .update(updateData)
      .eq("id", swapId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ status: updateData.status })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
