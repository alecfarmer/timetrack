import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// Shared company locations that every new user gets (everything except WFH)
const COMPANY_LOCATIONS = [
  {
    name: "US0",
    code: "US0",
    category: "PLANT",
    address: "1401 Antioch Church Rd, Greenville, SC 29605",
    latitude: 34.8526,
    longitude: -82.394,
    geofenceRadius: 50,
    isDefault: true,
  },
  {
    name: "HNA",
    code: "HNA",
    category: "OFFICE",
    address: "1 Parkway S, Greenville, SC 29615",
    latitude: 34.8447,
    longitude: -82.3987,
    geofenceRadius: 50,
  },
  {
    name: "US2",
    code: "US2",
    category: "PLANT",
    address: "6301 US-76, Pendleton, SC 29670",
    latitude: 34.6518,
    longitude: -82.7836,
    geofenceRadius: 50,
  },
  {
    name: "SPA",
    code: "SPA",
    category: "PLANT",
    address: "1000 International Dr, Spartanburg, SC 29303",
    latitude: 34.9285,
    longitude: -81.9571,
    geofenceRadius: 50,
  },
  {
    name: "LXT",
    code: "LXT",
    category: "PLANT",
    address: "2420 Two Notch Rd, Lexington, SC 29072",
    latitude: 33.9812,
    longitude: -81.2365,
    geofenceRadius: 50,
  },
  {
    name: "MCC",
    code: "MCC",
    category: "OFFICE",
    address: "515 Michelin Rd, Greenville, SC 29605",
    latitude: 34.72946,
    longitude: -82.36624,
    geofenceRadius: 50,
  },
  {
    name: "MARC",
    code: "MARC",
    category: "OFFICE",
    address: "515 Michelin Rd, Greenville, SC 29605",
    latitude: 34.725493,
    longitude: -82.36745,
    geofenceRadius: 100,
  },
]

// GET /api/onboarding - Check onboarding status
export async function GET() {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    // Check if user has any locations
    const { count, error } = await supabase
      .from("Location")
      .select("*", { count: "exact", head: true })
      .eq("userId", user!.id)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to check onboarding status" },
        { status: 500 }
      )
    }

    const hasLocations = (count || 0) > 0

    // Check if user has a WFH location
    const { data: wfhLocation } = await supabase
      .from("Location")
      .select("id")
      .eq("userId", user!.id)
      .eq("category", "HOME")
      .limit(1)
      .single()

    return NextResponse.json({
      needsOnboarding: !hasLocations,
      hasWfhLocation: !!wfhLocation,
      locationCount: count || 0,
    })
  } catch (error) {
    console.error("Error checking onboarding:", error)
    return NextResponse.json(
      { error: "Failed to check onboarding status" },
      { status: 500 }
    )
  }
}

// POST /api/onboarding - Provision company locations + optionally WFH
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const body = await request.json()
    const { wfhAddress, wfhLatitude, wfhLongitude } = body

    // Check if already provisioned
    const { count } = await supabase
      .from("Location")
      .select("*", { count: "exact", head: true })
      .eq("userId", user!.id)

    if ((count || 0) > 0) {
      return NextResponse.json(
        { error: "User already has locations provisioned" },
        { status: 409 }
      )
    }

    // Insert all company locations for this user
    const locationsToInsert = COMPANY_LOCATIONS.map((loc) => ({
      ...loc,
      userId: user!.id,
      isDefault: loc.isDefault || false,
    }))

    // Add WFH if provided
    if (wfhLatitude !== undefined && wfhLongitude !== undefined) {
      locationsToInsert.push({
        name: "WFH",
        code: "WFH",
        category: "HOME",
        address: wfhAddress || "",
        latitude: wfhLatitude,
        longitude: wfhLongitude,
        geofenceRadius: 200,
        isDefault: false,
        userId: user!.id,
      })
    }

    const { data: locations, error } = await supabase
      .from("Location")
      .insert(locationsToInsert)
      .select()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to provision locations", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      locationsCreated: locations?.length || 0,
      hasWfh: wfhLatitude !== undefined,
    }, { status: 201 })
  } catch (error) {
    console.error("Error during onboarding:", error)
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    )
  }
}
