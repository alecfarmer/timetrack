import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { z } from "zod"

const updateEntrySchema = z.object({
  notes: z.string().max(500).optional().nullable(),
})

// PATCH /api/entries/[id] - Update entry (notes only for now)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    const { id } = await params
    const body = await request.json()

    // Validate request body
    const parseResult = updateEntrySchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { notes } = parseResult.data

    // Verify entry exists and belongs to user or user is admin
    const { data: entry, error: fetchError } = await supabase
      .from("Entry")
      .select("id, userId")
      .eq("id", id)
      .single()

    if (fetchError || !entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    // Check authorization: user owns the entry or is admin
    const isOwner = entry.userId === user!.id
    const isAdmin = org?.role === "ADMIN"

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Not authorized to update this entry" },
        { status: 403 }
      )
    }

    // Update the entry
    const { data: updatedEntry, error: updateError } = await supabase
      .from("Entry")
      .update({ notes: notes ?? null })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating entry:", updateError)
      return NextResponse.json(
        { error: "Failed to update entry" },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedEntry)
  } catch (error) {
    console.error("Error updating entry:", error)
    return NextResponse.json(
      { error: "Failed to update entry" },
      { status: 500 }
    )
  }
}
