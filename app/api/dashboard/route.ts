import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, format } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { getRequestTimezone } from "@/lib/validations"

// GET /api/dashboard - Single endpoint for all dashboard data
// Combines: onboarding, locations, current status, week summary
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const userId = user!.id
    const tz = getRequestTimezone(request)
    const now = new Date()
    const zonedNow = toZonedTime(now, tz)
    const todayStart = startOfDay(zonedNow)
    const todayEnd = endOfDay(zonedNow)
    const weekStart = startOfWeek(zonedNow, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(zonedNow, { weekStartsOn: 1 })

    // Run all queries in parallel
    const [
      membershipResult,
      locationsResult,
      todayEntriesResult,
      weekWorkDaysResult,
      policyResult,
    ] = await Promise.all([
      // Check membership (for onboarding)
      supabase
        .from("Membership")
        .select("orgId, role")
        .eq("userId", userId)
        .limit(1)
        .single(),

      // Get locations
      supabase
        .from("Location")
        .select("id, name, code, category, latitude, longitude, geofenceRadius, isDefault")
        .order("isDefault", { ascending: false })
        .order("name"),

      // Get today's entries
      supabase
        .from("Entry")
        .select("id, type, timestampServer, timestampClient, gpsLatitude, gpsLongitude, gpsAccuracy, notes, location:Location(id, name, code)")
        .eq("userId", userId)
        .gte("timestampServer", todayStart.toISOString())
        .lte("timestampServer", todayEnd.toISOString())
        .order("timestampServer", { ascending: false }),

      // Get this week's workdays
      supabase
        .from("WorkDay")
        .select("date, totalMinutes, location:Location(category)")
        .eq("userId", userId)
        .gte("date", format(weekStart, "yyyy-MM-dd"))
        .lte("date", format(weekEnd, "yyyy-MM-dd")),

      // Get org policy
      supabase
        .from("PolicyConfig")
        .select("requiredOnsiteDays")
        .limit(1)
        .single(),
    ])

    // Check if needs onboarding
    const needsOnboarding = !membershipResult.data

    if (needsOnboarding) {
      return NextResponse.json({
        needsOnboarding: true,
        locations: [],
        currentStatus: null,
        weekSummary: null,
      })
    }

    // Process locations
    const locations = locationsResult.data || []

    // Process today's entries for current status
    const todayEntries = (todayEntriesResult.data || []).map((e) => {
      const loc = Array.isArray(e.location) ? e.location[0] : e.location
      return {
        id: e.id,
        type: e.type,
        timestampServer: e.timestampServer,
        timestampClient: e.timestampClient,
        gpsLatitude: e.gpsLatitude,
        gpsLongitude: e.gpsLongitude,
        gpsAccuracy: e.gpsAccuracy,
        notes: e.notes,
        location: {
          id: loc?.id || "",
          name: loc?.name || "Unknown",
          code: loc?.code ?? null,
        },
      }
    })

    // Calculate clock status
    const latestEntry = todayEntries[0]
    const isClockedIn = latestEntry?.type === "CLOCK_IN"
    const activeClockIn = isClockedIn ? latestEntry : null

    // Calculate time worked today
    let totalMinutesToday = 0
    let currentSessionStart: Date | null = null
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

    // Add current session time if clocked in
    if (isClockedIn && currentSessionStart) {
      totalMinutesToday += Math.floor((now.getTime() - currentSessionStart.getTime()) / 60000)
    }

    // Process week summary
    const workDays = weekWorkDaysResult.data || []
    const requiredDays = policyResult.data?.requiredOnsiteDays ?? 3

    // Count on-site days (exclude HOME)
    const onsiteDays = workDays.filter((wd) => {
      const loc = Array.isArray(wd.location) ? wd.location[0] : wd.location
      return loc?.category !== "HOME"
    })
    const daysWorked = onsiteDays.length

    // Build week days array
    const weekDays: { date: string; dayOfWeek: string; worked: boolean }[] = []
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const workedDates = new Set(onsiteDays.map((wd) => wd.date))

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + i)
      const dateStr = format(date, "yyyy-MM-dd")
      weekDays.push({
        date: dateStr,
        dayOfWeek: dayNames[date.getDay()],
        worked: workedDates.has(dateStr),
      })
    }

    return NextResponse.json({
      needsOnboarding: false,
      locations,
      currentStatus: {
        isClockedIn,
        activeClockIn,
        currentSessionStart: currentSessionStart?.toISOString() || null,
        todayEntries,
        totalMinutesToday,
      },
      weekSummary: {
        daysWorked,
        requiredDays,
        isCompliant: daysWorked >= requiredDays,
        weekDays,
      },
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 })
  }
}
