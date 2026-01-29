import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { createLocationSchema, updateLocationSchema, validateBody } from "@/lib/validations"

// GET /api/locations - List locations for the user's org (shared + personal)
export async function GET() {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org) {
      return NextResponse.json([], { status: 200 })
    }

    // Fetch org locations: shared (userId IS NULL) + user's personal (userId = user.id)
    const { data: locations, error } = await supabase
      .from("Location")
      .select("*")
      .eq("orgId", org.orgId)
      .or(`userId.is.null,userId.eq.${user!.id}`)
      .order("isDefault", { ascending: false })
      .order("name", { ascending: true })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to fetch locations", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(locations)
  } catch (error) {
    console.error("Error fetching locations:", error)
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    )
  }
}

// POST /api/locations - Create a new location
export async function POST(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 })
    }

    const body = await request.json()
    const validation = validateBody(createLocationSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const {
      name,
      code,
      category,
      address,
      latitude,
      longitude,
      geofenceRadius,
      isDefault,
    } = validation.data

    // Personal locations (HOME) are user-scoped; shared locations require admin
    const isPersonal = category === "HOME"
    if (!isPersonal && org.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can create shared locations" },
        { status: 403 }
      )
    }

    // If setting as default (admin only for shared), unset other defaults
    if (isDefault && org.role === "ADMIN") {
      await supabase
        .from("Location")
        .update({ isDefault: false })
        .eq("isDefault", true)
        .eq("orgId", org.orgId)
        .is("userId", null)
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
        orgId: org.orgId,
        userId: isPersonal ? user!.id : null,
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

// PATCH /api/locations - Update a location
export async function PATCH(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 })
    }

    const body = await request.json()
    const validation = validateBody(updateLocationSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { id, latitude, longitude, geofenceRadius, name, code, address } = validation.data

    // Check if this is user's personal location or a shared org location
    const { data: existing } = await supabase
      .from("Location")
      .select("userId, orgId")
      .eq("id", id)
      .eq("orgId", org.orgId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    // Shared locations require admin; personal locations require ownership
    if (existing.userId === null && org.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can update shared locations" }, { status: 403 })
    }
    if (existing.userId !== null && existing.userId !== user!.id) {
      return NextResponse.json({ error: "Not your location" }, { status: 403 })
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
      .eq("orgId", org.orgId)
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

// DELETE /api/locations - Delete a location
export async function DELETE(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 }
      )
    }

    // Check ownership/admin
    const { data: existing } = await supabase
      .from("Location")
      .select("userId")
      .eq("id", id)
      .eq("orgId", org.orgId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    if (existing.userId === null && org.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can delete shared locations" }, { status: 403 })
    }
    if (existing.userId !== null && existing.userId !== user!.id) {
      return NextResponse.json({ error: "Not your location" }, { status: 403 })
    }

    const { error } = await supabase
      .from("Location")
      .delete()
      .eq("id", id)
      .eq("orgId", org.orgId)

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
