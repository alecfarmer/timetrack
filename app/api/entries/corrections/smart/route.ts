import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

const CORRECTABLE_FIELDS = ["timestampClient", "locationId", "notes", "type"]

// POST /api/entries/corrections/smart - Smart correction with auto-approval logic
export async function POST(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    const body = await request.json()
    const { entryId, field, newValue, reason } = body

    if (!entryId || !field || newValue === undefined || !reason) {
      return NextResponse.json(
        { error: "entryId, field, newValue, and reason are required" },
        { status: 400 }
      )
    }

    if (!CORRECTABLE_FIELDS.includes(field)) {
      return NextResponse.json(
        { error: `Invalid field. Must be one of: ${CORRECTABLE_FIELDS.join(", ")}` },
        { status: 400 }
      )
    }

    // Fetch the entry
    const { data: entry, error: entryError } = await supabase
      .from("Entry")
      .select("*")
      .eq("id", entryId)
      .single()

    if (entryError || !entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    // Check ownership or admin access
    if (entry.userId !== user!.id && org?.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const oldValue = String(entry[field] ?? "")

    // Determine auto-approval
    let autoApproved = false

    // Check 1: Look at user's last 30 corrections for the same field.
    // If 3+ of them were approved, auto-approve.
    const { data: pastCorrections } = await supabase
      .from("EntryCorrection")
      .select("id, fieldChanged, status")
      .eq("correctedBy", user!.id)
      .order("createdAt", { ascending: false })
      .limit(30)

    if (pastCorrections) {
      const approvedSameField = pastCorrections.filter(
        (c: { fieldChanged: string; status: string }) =>
          c.fieldChanged === field && c.status === "APPROVED"
      )
      if (approvedSameField.length >= 3) {
        autoApproved = true
      }
    }

    // Check 2: For timestampClient corrections, auto-approve if diff <= 5 minutes
    if (!autoApproved && field === "timestampClient" && oldValue && newValue) {
      const oldTime = new Date(oldValue).getTime()
      const newTime = new Date(String(newValue)).getTime()
      if (!isNaN(oldTime) && !isNaN(newTime)) {
        const diffMinutes = Math.abs(newTime - oldTime) / 60000
        if (diffMinutes <= 5) {
          autoApproved = true
        }
      }
    }

    const status = autoApproved ? "APPROVED" : "PENDING"

    // Create the EntryCorrection record
    const { data: correction, error: corrError } = await supabase
      .from("EntryCorrection")
      .insert({
        entryId,
        correctedBy: user!.id,
        reason,
        fieldChanged: field,
        oldValue,
        newValue: String(newValue),
        status,
        autoApproved,
      })
      .select()
      .single()

    if (corrError) {
      console.error("Failed to create correction:", corrError)
      return NextResponse.json(
        { error: "Failed to record correction" },
        { status: 500 }
      )
    }

    // If auto-approved, apply the update to the Entry immediately
    if (autoApproved) {
      const { error: updateError } = await supabase
        .from("Entry")
        .update({ [field]: newValue })
        .eq("id", entryId)

      if (updateError) {
        console.error("Failed to apply auto-approved correction:", updateError)
        return NextResponse.json(
          { error: "Correction recorded but failed to apply update" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { ...correction, autoApproved },
      { status: 201 }
    )
  } catch (error) {
    console.error("Smart correction error:", error)
    return NextResponse.json(
      { error: "Failed to create smart correction" },
      { status: 500 }
    )
  }
}
