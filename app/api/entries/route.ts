import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { startOfDay, endOfDay } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { createEntrySchema, validateBody, getRequestTimezone } from "@/lib/validations"

// GET /api/entries - List entries with optional filters
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const searchParams = request.nextUrl.searchParams
    const locationId = searchParams.get("locationId")
    const date = searchParams.get("date")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("Entry")
      .select(`
        *,
        location:Location (id, name, code, category)
      `, { count: "exact" })
      .eq("userId", user!.id)
      .order("timestampServer", { ascending: false })
      .range(offset, offset + limit - 1)

    if (locationId) {
      query = query.eq("locationId", locationId)
    }

    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (date) {
      const targetDate = new Date(date)
      const zonedDate = toZonedTime(targetDate, getRequestTimezone(request))
      query = query
        .gte("timestampServer", startOfDay(zonedDate).toISOString())
        .lte("timestampServer", endOfDay(zonedDate).toISOString())
    } else if (startDate && endDate) {
      query = query
        .gte("timestampServer", new Date(startDate).toISOString())
        .lte("timestampServer", new Date(endDate).toISOString())
    }

    const { data: entries, count, error } = await query

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to fetch entries" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      entries,
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching entries:", error)
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    )
  }
}

// POST /api/entries - Create a new entry (clock in/out)
export async function POST(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    const body = await request.json()
    const validation = validateBody(createEntrySchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const {
      type,
      locationId,
      timestampClient,
      gpsLatitude,
      gpsLongitude,
      gpsAccuracy,
      notes,
      photoUrl,
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

    // Create the entry
    const now = new Date()
    const { data: entry, error: entryError } = await supabase
      .from("Entry")
      .insert({
        type,
        locationId,
        userId: user!.id,
        timestampClient: timestampClient ? new Date(timestampClient).toISOString() : now.toISOString(),
        timestampServer: now.toISOString(),
        gpsLatitude,
        gpsLongitude,
        gpsAccuracy,
        notes,
        photoUrl: photoUrl || null,
      })
      .select(`
        *,
        location:Location (id, name, code, category)
      `)
      .single()

    if (entryError) {
      console.error("Supabase error:", entryError)
      return NextResponse.json(
        { error: "Failed to create entry" },
        { status: 500 }
      )
    }

    // Update or create WorkDay
    const serverDate = new Date(entry.timestampServer)
    const zonedDate = toZonedTime(serverDate, getRequestTimezone(request))
    const workDayDate = startOfDay(zonedDate)

    const { data: existingWorkDay } = await supabase
      .from("WorkDay")
      .select("*")
      .eq("date", workDayDate.toISOString().split("T")[0])
      .eq("locationId", locationId)
      .eq("userId", user!.id)
      .single()

    if (existingWorkDay) {
      const updateData: Record<string, unknown> = {}

      if (type === "CLOCK_IN") {
        if (!existingWorkDay.firstClockIn || serverDate < new Date(existingWorkDay.firstClockIn)) {
          updateData.firstClockIn = serverDate.toISOString()
        }
      } else {
        if (!existingWorkDay.lastClockOut || serverDate > new Date(existingWorkDay.lastClockOut)) {
          updateData.lastClockOut = serverDate.toISOString()
        }
      }

      if (existingWorkDay.firstClockIn && (updateData.lastClockOut || existingWorkDay.lastClockOut)) {
        const clockOut = new Date((updateData.lastClockOut as string) || existingWorkDay.lastClockOut)
        const totalMinutes = Math.floor(
          (clockOut.getTime() - new Date(existingWorkDay.firstClockIn).getTime()) / 60000
        )
        updateData.totalMinutes = totalMinutes
        updateData.meetsPolicy = totalMinutes > 0
      }

      await supabase
        .from("WorkDay")
        .update(updateData)
        .eq("id", existingWorkDay.id)

      await supabase
        .from("Entry")
        .update({ workDayId: existingWorkDay.id })
        .eq("id", entry.id)
    } else {
      const { data: workDay } = await supabase
        .from("WorkDay")
        .insert({
          date: workDayDate.toISOString().split("T")[0],
          locationId,
          userId: user!.id,
          firstClockIn: type === "CLOCK_IN" ? serverDate.toISOString() : null,
          lastClockOut: type === "CLOCK_OUT" ? serverDate.toISOString() : null,
          meetsPolicy: type === "CLOCK_IN",
        })
        .select()
        .single()

      if (workDay) {
        await supabase
          .from("Entry")
          .update({ workDayId: workDay.id })
          .eq("id", entry.id)
      }
    }

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error("Error creating entry:", error)
    return NextResponse.json(
      { error: "Failed to create entry" },
      { status: 500 }
    )
  }
}
