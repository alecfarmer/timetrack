import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

const CORRECTABLE_FIELDS = ["timestampClient", "locationId", "notes", "type"]

// GET /api/entries/corrections?entryId=xxx
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    const entryId = request.nextUrl.searchParams.get("entryId")
    if (!entryId) {
      return NextResponse.json({ error: "entryId is required" }, { status: 400 })
    }

    const { data: entry } = await supabase
      .from("Entry")
      .select("userId")
      .eq("id", entryId)
      .single()

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    if (entry.userId !== user!.id && org?.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { data: corrections, error } = await supabase
      .from("EntryCorrection")
      .select("*")
      .eq("entryId", entryId)
      .order("createdAt", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch corrections" }, { status: 500 })
    }

    return NextResponse.json(corrections || [])
  } catch (error) {
    console.error("Error fetching corrections:", error)
    return NextResponse.json({ error: "Failed to fetch corrections" }, { status: 500 })
  }
}

// POST /api/entries/corrections - Create a correction
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

    const { data: entry } = await supabase
      .from("Entry")
      .select("*")
      .eq("id", entryId)
      .single()

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    if (entry.userId !== user!.id && org?.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const oldValue = String(entry[field] ?? "")

    const { data: correction, error: corrError } = await supabase
      .from("EntryCorrection")
      .insert({
        entryId,
        correctedBy: user!.id,
        reason,
        fieldChanged: field,
        oldValue,
        newValue: String(newValue),
      })
      .select()
      .single()

    if (corrError) {
      return NextResponse.json({ error: "Failed to record correction" }, { status: 500 })
    }

    // When correcting timestampClient, also update timestampServer so the
    // displayed time (which reads timestampServer) reflects the correction.
    const updateFields: Record<string, string> = { [field]: newValue }
    if (field === "timestampClient") {
      updateFields.timestampServer = new Date(newValue).toISOString()
    }

    const { error: updateError } = await supabase
      .from("Entry")
      .update(updateFields)
      .eq("id", entryId)

    if (updateError) {
      return NextResponse.json({ error: "Failed to apply correction" }, { status: 500 })
    }

    return NextResponse.json(correction, { status: 201 })
  } catch (error) {
    console.error("Error creating correction:", error)
    return NextResponse.json({ error: "Failed to create correction" }, { status: 500 })
  }
}
