import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// GET /api/locations - List locations for the authenticated user
export async function GET() {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const { data: locations, error } = await supabase
      .from("Location")
      .select("*")
      .eq("userId", user!.id)
      .order("isDefault", { ascending: false })
      .order("name", { ascending: true })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch locations",
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(locations)
  } catch (error) {
    console.error("Error fetching locations:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        error: "Failed to fetch locations",
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

// POST /api/locations - Create a new location for the authenticated user
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const body = await request.json()
    const {
      name,
      code,
      category,
      address,
      latitude,
      longitude,
      geofenceRadius,
      isDefault,
    } = body

    // Validate required fields
    if (!name || latitude === undefined || longitude === undefined || !category) {
      return NextResponse.json(
        { error: "Missing required fields: name, latitude, longitude, category" },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults for this user
    if (isDefault) {
      await supabase
        .from("Location")
        .update({ isDefault: false })
        .eq("isDefault", true)
        .eq("userId", user!.id)
    }

    const { data: location, error } = await supabase
      .from("Location")
      .insert({
        name,
        code,
        category,
        address,
        latitude,
        longitude,
        geofenceRadius: geofenceRadius || 50,
        isDefault: isDefault || false,
        userId: user!.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to create location", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error("Error creating location:", error)
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    )
  }
}

// PATCH /api/locations - Update a location (must belong to the user)
export async function PATCH(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const body = await request.json()
    const { id, latitude, longitude, geofenceRadius, name, code, address } = body

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (latitude !== undefined) updateData.latitude = latitude
    if (longitude !== undefined) updateData.longitude = longitude
    if (geofenceRadius !== undefined) updateData.geofenceRadius = geofenceRadius
    if (name !== undefined) updateData.name = name
    if (code !== undefined) updateData.code = code
    if (address !== undefined) updateData.address = address

    const { data: location, error } = await supabase
      .from("Location")
      .update(updateData)
      .eq("id", id)
      .eq("userId", user!.id)
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to update location", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error("Error updating location:", error)
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    )
  }
}

// DELETE /api/locations - Delete a location (must belong to user, cannot delete if has entries)
export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const { searchParams } = request.nextUrl
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("Location")
      .delete()
      .eq("id", id)
      .eq("userId", user!.id)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to delete location", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting location:", error)
    return NextResponse.json(
      { error: "Failed to delete location" },
      { status: 500 }
    )
  }
}
