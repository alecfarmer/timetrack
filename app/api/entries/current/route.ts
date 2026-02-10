import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { startOfDay, endOfDay } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { getRequestTimezone } from "@/lib/validations"

interface EntryWithLocation {
  id: string
  type: string
  timestampServer: string
  gpsAccuracy: number | null
  notes: string | null
  photoUrl: string | null
  location: { id: string; name: string; code: string | null }
}

// GET /api/entries/current - Get current clock status
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const now = new Date()
    const zonedNow = toZonedTime(now, getRequestTimezone(request))
    const todayStart = startOfDay(zonedNow)
    const todayEnd = endOfDay(zonedNow)

    const { data: dbEntries, error } = await supabase
      .from("Entry")
      .select(`
        id, type, timestampServer, gpsAccuracy, notes, photoUrl,
        location:Location (id, name, code)
      `)
      .eq("userId", user!.id)
      .gte("timestampServer", todayStart.toISOString())
      .lte("timestampServer", todayEnd.toISOString())
      .order("timestampServer", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({
        isClockedIn: false,
        activeClockIn: null,
        currentSessionStart: null,
        todayEntries: [],
        totalMinutesToday: 0,
      })
    }

    const todayEntries: EntryWithLocation[] = (dbEntries || []).map((e) => {
      // Supabase returns location as object or array depending on relationship
      const loc = Array.isArray(e.location) ? e.location[0] : e.location
      return {
        id: e.id,
        type: e.type,
        timestampServer: e.timestampServer,
        gpsAccuracy: (e as Record<string, unknown>).gpsAccuracy as number | null,
        notes: (e as Record<string, unknown>).notes as string | null,
        photoUrl: (e as Record<string, unknown>).photoUrl as string | null,
        location: {
          id: loc?.id || "",
          name: loc?.name || "Unknown",
          code: loc?.code ?? null,
        },
      }
    })

    // Determine if currently clocked in
    const latestEntry = todayEntries[0]
    const isClockedIn = latestEntry?.type === "CLOCK_IN"

    // Get the active clock-in entry if clocked in
    const activeClockIn = isClockedIn ? latestEntry : null

    // Calculate time worked today
    let totalMinutesToday = 0
    let currentSessionStart: Date | null = null

    // Process entries in chronological order
    const chronologicalEntries = [...todayEntries].reverse()
    let clockInTime: Date | null = null

    for (const entry of chronologicalEntries) {
      if (entry.type === "CLOCK_IN") {
        clockInTime = new Date(entry.timestampServer)
        if (isClockedIn && entry.id === activeClockIn?.id) {
          currentSessionStart = clockInTime
        }
      } else if (entry.type === "CLOCK_OUT" && clockInTime) {
        const sessionMinutes = Math.floor(
          (new Date(entry.timestampServer).getTime() - clockInTime.getTime()) / 60000
        )
        totalMinutesToday += sessionMinutes
        clockInTime = null
      }
    }

    // Add current session time if still clocked in
    if (isClockedIn && currentSessionStart) {
      const currentSessionMinutes = Math.floor(
        (now.getTime() - currentSessionStart.getTime()) / 60000
      )
      totalMinutesToday += currentSessionMinutes
    }

    return NextResponse.json({
      isClockedIn,
      activeClockIn,
      currentSessionStart: currentSessionStart?.toISOString() || null,
      todayEntries,
      totalMinutesToday,
    })
  } catch (error) {
    console.error("Error fetching current status:", error)
    return NextResponse.json({
      isClockedIn: false,
      activeClockIn: null,
      currentSessionStart: null,
      todayEntries: [],
      totalMinutesToday: 0,
    })
  }
}
