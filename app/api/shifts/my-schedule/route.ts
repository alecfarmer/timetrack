import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { startOfWeek, endOfWeek, addWeeks, format, eachDayOfInterval, getDay } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { getRequestTimezone } from "@/lib/validations"

interface ShiftAssignment {
  id: string
  shiftId: string
  effectiveDate: string
  endDate: string | null
  shift: {
    id: string
    name: string
    startTime: string
    endTime: string
    daysOfWeek: number[]
    color: string
    isActive: boolean
  }
}

interface ScheduledShift {
  date: string
  dayOfWeek: string
  shiftId: string
  shiftName: string
  startTime: string
  endTime: string
  color: string
}

// GET /api/shifts/my-schedule - Get employee's assigned shifts for current and next week
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const searchParams = request.nextUrl.searchParams
    const weeksAhead = parseInt(searchParams.get("weeks") || "2")

    const timezone = getRequestTimezone(request)
    const now = new Date()
    const zonedNow = toZonedTime(now, timezone)

    // Get week boundaries
    const weekStart = startOfWeek(zonedNow, { weekStartsOn: 1 }) // Monday
    const scheduleEnd = endOfWeek(addWeeks(zonedNow, weeksAhead - 1), { weekStartsOn: 1 })

    // Fetch user's shift assignments with shift details
    const { data: assignments, error } = await supabase
      .from("ShiftAssignment")
      .select(`
        id,
        shiftId,
        effectiveDate,
        endDate,
        shift:Shift (
          id,
          name,
          startTime,
          endTime,
          daysOfWeek,
          color,
          isActive
        )
      `)
      .eq("userId", user!.id)
      .lte("effectiveDate", scheduleEnd.toISOString().split("T")[0])
      .or(`endDate.is.null,endDate.gte.${weekStart.toISOString().split("T")[0]}`)

    if (error) {
      console.error("Error fetching shift assignments:", error)
      return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 })
    }

    // Generate schedule for each day
    const allDays = eachDayOfInterval({ start: weekStart, end: scheduleEnd })
    const schedule: ScheduledShift[] = []

    for (const day of allDays) {
      const dateStr = format(day, "yyyy-MM-dd")
      const dayOfWeekNum = getDay(day) // 0 = Sunday, 1 = Monday, etc.

      for (const assignment of (assignments || [])) {
        const rawShift = assignment.shift
        const shift = Array.isArray(rawShift) ? rawShift[0] : rawShift
        if (!shift || !shift.isActive) continue

        // Check if assignment is active on this date
        if (dateStr < assignment.effectiveDate) continue
        if (assignment.endDate && dateStr > assignment.endDate) continue

        // Check if shift runs on this day of week
        if (!shift.daysOfWeek.includes(dayOfWeekNum)) continue

        schedule.push({
          date: dateStr,
          dayOfWeek: format(day, "EEE"),
          shiftId: shift.id,
          shiftName: shift.name,
          startTime: shift.startTime,
          endTime: shift.endTime,
          color: shift.color || "#3b82f6",
        })
      }
    }

    // Sort by date
    schedule.sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      schedule,
      weekStart: weekStart.toISOString(),
      weekEnd: scheduleEnd.toISOString(),
    })
  } catch (error) {
    console.error("Error fetching schedule:", error)
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 })
  }
}
