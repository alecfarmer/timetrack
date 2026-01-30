import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// GET /api/callouts/[id] - Get a single callout
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const { id } = await params

    const { data: callout, error } = await supabase
      .from("Callout")
      .select(`
        *,
        location:Location (id, name, code)
      `)
      .eq("id", id)
      .eq("userId", user!.id)
      .single()

    if (error || !callout) {
      return NextResponse.json(
        { error: "Callout not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(callout)
  } catch (error) {
    console.error("Error fetching callout:", error)
    return NextResponse.json(
      { error: "Failed to fetch callout" },
      { status: 500 }
    )
  }
}

// PATCH /api/callouts/[id] - Update a callout
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const { id } = await params
    const body = await request.json()
    const {
      incidentNumber,
      locationId,
      timeReceived,
      timeStarted,
      timeEnded,
      gpsLatitude,
      gpsLongitude,
      gpsAccuracy,
      description,
      resolution,
    } = body

    // Check if callout exists and belongs to user
    const { data: existingCallout } = await supabase
      .from("Callout")
      .select("id")
      .eq("id", id)
      .eq("userId", user!.id)
      .single()

    if (!existingCallout) {
      return NextResponse.json(
        { error: "Callout not found" },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (incidentNumber !== undefined) updateData.incidentNumber = incidentNumber
    if (locationId !== undefined) updateData.locationId = locationId
    if (timeReceived !== undefined) updateData.timeReceived = new Date(timeReceived).toISOString()
    if (timeStarted !== undefined) updateData.timeStarted = timeStarted ? new Date(timeStarted).toISOString() : null
    if (timeEnded !== undefined) updateData.timeEnded = timeEnded ? new Date(timeEnded).toISOString() : null
    if (gpsLatitude !== undefined) updateData.gpsLatitude = gpsLatitude
    if (gpsLongitude !== undefined) updateData.gpsLongitude = gpsLongitude
    if (gpsAccuracy !== undefined) updateData.gpsAccuracy = gpsAccuracy
    if (description !== undefined) updateData.description = description
    if (resolution !== undefined) updateData.resolution = resolution

    const { data: callout, error } = await supabase
      .from("Callout")
      .update(updateData)
      .eq("id", id)
      .eq("userId", user!.id)
      .select(`
        *,
        location:Location (id, name, code)
      `)
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to update callout", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(callout)
  } catch (error) {
    console.error("Error updating callout:", error)
    return NextResponse.json(
      { error: "Failed to update callout" },
      { status: 500 }
    )
  }
}

// DELETE /api/callouts/[id] - Delete a callout
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const { id } = await params

    // Check if callout exists and belongs to user
    const { data: existingCallout } = await supabase
      .from("Callout")
      .select("id")
      .eq("id", id)
      .eq("userId", user!.id)
      .single()

    if (!existingCallout) {
      return NextResponse.json(
        { error: "Callout not found" },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from("Callout")
      .delete()
      .eq("id", id)
      .eq("userId", user!.id)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to delete callout", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting callout:", error)
    return NextResponse.json(
      { error: "Failed to delete callout" },
      { status: 500 }
    )
  }
}
