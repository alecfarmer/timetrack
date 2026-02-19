import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { createCalloutSchema, validateBody, getRequestTimezone } from "@/lib/validations"

// GET /api/callouts - List callouts with optional filters
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const searchParams = request.nextUrl.searchParams
    const locationId = searchParams.get("locationId")
    const date = searchParams.get("date")
    const month = searchParams.get("month") // Format: YYYY-MM
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("Callout")
      .select(`
        *,
        location:Location (id, name, code)
      `, { count: "exact" })
      .eq("userId", user!.id)
      .order("timeReceived", { ascending: false })
      .range(offset, offset + limit - 1)

    if (locationId) {
      query = query.eq("locationId", locationId)
    }

    if (date) {
      const targetDate = new Date(date)
      const zonedDate = toZonedTime(targetDate, getRequestTimezone(request))
      query = query
        .gte("timeReceived", startOfDay(zonedDate).toISOString())
        .lte("timeReceived", endOfDay(zonedDate).toISOString())
    } else if (month) {
      const [year, monthNum] = month.split("-").map(Number)
      const targetDate = new Date(year, monthNum - 1, 1)
      const zonedDate = toZonedTime(targetDate, getRequestTimezone(request))
      query = query
        .gte("timeReceived", startOfMonth(zonedDate).toISOString())
        .lte("timeReceived", endOfMonth(zonedDate).toISOString())
    }

    const { data: callouts, count, error } = await query

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to fetch callouts", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      callouts,
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching callouts:", error)
    return NextResponse.json(
      { error: "Failed to fetch callouts" },
      { status: 500 }
    )
  }
}

// POST /api/callouts - Create a new callout
export async function POST(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    const body = await request.json()
    const validation = validateBody(createCalloutSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const {
      incidentNumber,
      locationId,
      priority,
      timeReceived,
      timeStarted,
      timeEnded,
      gpsLatitude,
      gpsLongitude,
      gpsAccuracy,
      description,
      resolution,
    } = validation.data

    // Verify location exists and belongs to user's org
    const { data: location, error: locError } = await supabase
      .from("Location")
      .select("id, orgId")
      .eq("id", locationId)
      .single()

    if (locError || !location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      )
    }

    if (org && location.orgId !== org.orgId) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      )
    }

    // Create the callout
    const { data: callout, error } = await supabase
      .from("Callout")
      .insert({
        incidentNumber,
        locationId,
        priority,
        userId: user!.id,
        timeReceived: new Date(timeReceived).toISOString(),
        timeStarted: timeStarted ? new Date(timeStarted).toISOString() : null,
        timeEnded: timeEnded ? new Date(timeEnded).toISOString() : null,
        gpsLatitude,
        gpsLongitude,
        gpsAccuracy,
        description,
        resolution,
      })
      .select(`
        *,
        location:Location (id, name, code)
      `)
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to create callout", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(callout, { status: 201 })
  } catch (error) {
    console.error("Error creating callout:", error)
    return NextResponse.json(
      { error: "Failed to create callout" },
      { status: 500 }
    )
  }
}
