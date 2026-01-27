import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET /api/locations - List all locations
export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      orderBy: [
        { isDefault: "desc" },
        { name: "asc" },
      ],
    })

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
      await prisma.location.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const location = await prisma.location.create({
      data: {
        name,
        code,
        category,
        address,
        latitude,
        longitude,
        geofenceRadius: geofenceRadius || 200,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error("Error creating location:", error)
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    )
  }
}
