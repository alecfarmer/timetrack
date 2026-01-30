import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// PATCH /api/entries/bulk - Bulk update entries (admin only)
export async function PATCH(request: NextRequest) {
  const { user, org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const body = await request.json()
  const { entryIds, updates } = body

  if (!Array.isArray(entryIds) || entryIds.length === 0) {
    return NextResponse.json({ error: "entryIds array is required" }, { status: 400 })
  }

  if (entryIds.length > 100) {
    return NextResponse.json({ error: "Maximum 100 entries per batch" }, { status: 400 })
  }

  if (!updates || typeof updates !== "object") {
    return NextResponse.json({ error: "updates object is required" }, { status: 400 })
  }

  const allowedFields = ["status", "notes"]
  const updateData: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      updateData[key] = updates[key]
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  // Verify all entries belong to org members
  const { data: entries, error: fetchError } = await supabase
    .from("Entry")
    .select("id, userId")
    .in("id", entryIds)

  if (fetchError) {
    return NextResponse.json({ error: "Failed to verify entries" }, { status: 500 })
  }

  const entryUserIds = new Set((entries || []).map((e) => e.userId))

  // Verify all users are in the same org
  const { data: memberships } = await supabase
    .from("Membership")
    .select("userId")
    .eq("orgId", org.orgId)
    .in("userId", Array.from(entryUserIds))

  const orgUserIds = new Set((memberships || []).map((m) => m.userId))
  const unauthorized = Array.from(entryUserIds).filter((uid) => !orgUserIds.has(uid))

  if (unauthorized.length > 0) {
    return NextResponse.json(
      { error: "Some entries belong to users outside your organization" },
      { status: 403 }
    )
  }

  // Perform bulk update
  const { error: updateError, count } = await supabase
    .from("Entry")
    .update(updateData)
    .in("id", entryIds)

  if (updateError) {
    return NextResponse.json({ error: "Failed to update entries" }, { status: 500 })
  }

  // Audit log
  await supabase.from("AuditLog").insert({
    orgId: org.orgId,
    userId: user!.id,
    action: "BULK_ENTRY_UPDATE",
    entityType: "Entry",
    entityId: entryIds[0],
    metadata: {
      entryCount: entryIds.length,
      updates: updateData,
      entryIds,
    },
  })

  return NextResponse.json({ updated: count || entryIds.length })
}

// POST /api/entries/bulk/approve-corrections - Bulk approve corrections (admin only)
export async function POST(request: NextRequest) {
  const { user, org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const body = await request.json()
  const { correctionIds, action } = body

  if (!Array.isArray(correctionIds) || correctionIds.length === 0) {
    return NextResponse.json({ error: "correctionIds array is required" }, { status: 400 })
  }

  if (!["APPROVED", "REJECTED"].includes(action)) {
    return NextResponse.json({ error: "action must be APPROVED or REJECTED" }, { status: 400 })
  }

  const { error, count } = await supabase
    .from("EntryCorrection")
    .update({
      status: action,
      reviewedBy: user!.id,
      reviewedAt: new Date().toISOString(),
    })
    .in("id", correctionIds)
    .eq("status", "PENDING")

  if (error) {
    return NextResponse.json({ error: "Failed to process corrections" }, { status: 500 })
  }

  // If approved, apply the corrections to the entries
  if (action === "APPROVED") {
    const { data: corrections } = await supabase
      .from("EntryCorrection")
      .select("entryId, field, newValue")
      .in("id", correctionIds)

    for (const correction of corrections || []) {
      await supabase
        .from("Entry")
        .update({ [correction.field]: correction.newValue })
        .eq("id", correction.entryId)
    }
  }

  // Audit log
  await supabase.from("AuditLog").insert({
    orgId: org.orgId,
    userId: user!.id,
    action: `BULK_CORRECTION_${action}`,
    entityType: "EntryCorrection",
    entityId: correctionIds[0],
    metadata: {
      correctionCount: correctionIds.length,
      action,
      correctionIds,
    },
  })

  return NextResponse.json({ processed: count || correctionIds.length, action })
}
