import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"

// GET /api/geocode?address=123+Main+St - Geocode an address to lat/lng
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await getAuthUser()
    if (authError) return authError

    const address = request.nextUrl.searchParams.get("address")
    if (!address || address.trim().length < 3) {
      return NextResponse.json(
        { error: "Address must be at least 3 characters" },
        { status: 400 }
      )
    }

    const encoded = encodeURIComponent(address.trim())
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1&addressdetails=1`,
      {
        headers: {
          "User-Agent": "OnSite-TimeTracker/1.0",
        },
      }
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: "Geocoding service unavailable" },
        { status: 502 }
      )
    }

    const results = await res.json()

    if (!results.length) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      )
    }

    const result = results[0]
    return NextResponse.json({
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
    })
  } catch (error) {
    console.error("Geocoding error:", error)
    return NextResponse.json(
      { error: "Failed to geocode address" },
      { status: 500 }
    )
  }
}
