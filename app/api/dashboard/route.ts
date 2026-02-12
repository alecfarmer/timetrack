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
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    const userId = user!.id

    // Check if needs onboarding (no org membership)
    if (!org) {
      return NextResponse.json({
        needsOnboarding: true,
        locations: [],
        currentStatus: null,
        weekSummary: null,
      })
    }

    const tz = getRequestTimezone(request)
    const now = new Date()
    const zonedNow = toZonedTime(now, tz)
    const todayStart = startOfDay(zonedNow)
    const todayEnd = endOfDay(zonedNow)
    const weekStart = startOfWeek(zonedNow, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(zonedNow, { weekStartsOn: 0 })

    // Run all queries in parallel
    const [
      locationsResult,
      todayEntriesResult,
      weekWorkDaysResult,
      policyResult,
    ] = await Promise.all([
      // Get locations for user's org (shared + personal)
      supabase
        .from("Location")
        .select("id, name, code, category, latitude, longitude, geofenceRadius, isDefault")
        .eq("orgId", org.orgId)
        .or(`userId.is.null,userId.eq.${userId}`)
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

      // Get this week's workdays (include totalMinutes for hours tracking)
      supabase
        .from("WorkDay")
        .select("date, totalMinutes, meetsPolicy, location:Location(category)")
        .eq("userId", userId)
        .gte("date", format(weekStart, "yyyy-MM-dd"))
        .lte("date", format(weekEnd, "yyyy-MM-dd"))
        .order("date", { ascending: true }),

      // Get org policy (use maybeSingle to handle missing policy gracefully)
      supabase
        .from("PolicyConfig")
        .select("requiredOnsiteDays")
        .eq("orgId", org.orgId)
        .maybeSingle(),
    ])

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

    // Calculate time worked today (sum sessions, subtract breaks)
    let totalMinutesToday = 0
    let currentSessionStart: Date | null = null
    const chronologicalEntries = [...todayEntries].reverse()
    let clockInTime: Date | null = null
    let breakTotalMs = 0
    let breakStartTime: Date | null = null

    for (const entry of chronologicalEntries) {
      const ts = new Date(entry.timestampServer)
      switch (entry.type) {
        case "CLOCK_IN":
          clockInTime = ts
          if (isClockedIn && entry.id === activeClockIn?.id) {
            currentSessionStart = ts
          }
          break
        case "CLOCK_OUT":
          if (clockInTime) {
            totalMinutesToday += Math.floor((ts.getTime() - clockInTime.getTime()) / 60000)
            clockInTime = null
          }
          break
        case "BREAK_START":
          breakStartTime = ts
          break
        case "BREAK_END":
          if (breakStartTime) {
            breakTotalMs += ts.getTime() - breakStartTime.getTime()
            breakStartTime = null
          }
          break
      }
    }

    // Add current session time if clocked in
    if (isClockedIn && currentSessionStart) {
      totalMinutesToday += Math.floor((now.getTime() - currentSessionStart.getTime()) / 60000)
    }

    // Subtract break time (including any ongoing break)
    if (breakStartTime) {
      breakTotalMs += now.getTime() - breakStartTime.getTime()
    }
    totalMinutesToday = Math.max(0, totalMinutesToday - Math.floor(breakTotalMs / 60000))

    // Process week summary
    const workDays = weekWorkDaysResult.data || []
    const requiredDays = policyResult.data?.requiredOnsiteDays ?? 3

    // Create a map of workdays by date for quick lookup
    const workDayMap = new Map(workDays.map((wd) => [wd.date, wd]))

    // Count on-site days (exclude HOME, must meet policy)
    const onsiteDays = workDays.filter((wd) => {
      const loc = Array.isArray(wd.location) ? wd.location[0] : wd.location
      return wd.meetsPolicy && loc?.category !== "HOME"
    })
    const daysWorked = onsiteDays.length

    // Calculate total minutes for the week
    const totalMinutes = workDays.reduce((sum, wd) => sum + (wd.totalMinutes || 0), 0)

    // Build week days array with minutes
    const weekDays: { date: string; dayOfWeek: string; worked: boolean; minutes: number }[] = []
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const workedDates = new Set(onsiteDays.map((wd) => wd.date))

    const todayStr = format(zonedNow, "yyyy-MM-dd")
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + i)
      const dateStr = format(date, "yyyy-MM-dd")
      const dayWorkDay = workDayMap.get(dateStr)
      weekDays.push({
        date: dateStr,
        dayOfWeek: dayNames[date.getDay()],
        worked: workedDates.has(dateStr),
        minutes: dayWorkDay?.totalMinutes || 0,
      })
    }

    // For today, use the live-calculated totalMinutesToday which includes
    // the current session and break deductions (WorkDay only updates on clock-out)
    const todayIdx = weekDays.findIndex(wd => wd.date === todayStr)
    if (todayIdx !== -1 && totalMinutesToday > 0) {
      weekDays[todayIdx].minutes = totalMinutesToday
      weekDays[todayIdx].worked = true
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
        totalMinutes,
        weekDays,
      },
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 })
  }
}
