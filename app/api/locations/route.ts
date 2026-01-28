import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// GET /api/locations - List all locations
export async function GET() {
  try {
    const { data: locations, error } = await supabase
      .from("Location")
      .select("*")
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

// POST /api/locations - Create a new location
export async function POST(request: NextRequest) {
  try {
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

    // If setting as default, unset other defaults
    if (isDefault) {
      await supabase
        .from("Location")
        .update({ isDefault: false })
        .eq("isDefault", true)
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
