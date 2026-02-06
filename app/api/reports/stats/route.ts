import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, getHours, getDay, differenceInMinutes, parseISO, subWeeks, subMonths } from "date-fns"

// GET /api/reports/stats - Get detailed productivity and time stats
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get("period") || "week" // week, month, quarter

    const now = new Date()
    let startDate: Date
    let prevStartDate: Date
    let prevEndDate: Date

    if (period === "month") {
      startDate = startOfMonth(now)
      prevStartDate = startOfMonth(subMonths(now, 1))
      prevEndDate = endOfMonth(subMonths(now, 1))
    } else if (period === "quarter") {
      startDate = subDays(now, 90)
      prevStartDate = subDays(now, 180)
      prevEndDate = subDays(now, 91)
    } else {
      startDate = startOfWeek(now, { weekStartsOn: 1 })
      prevStartDate = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
      prevEndDate = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
    }

    // Fetch current period work days
    const { data: currentWorkDays } = await supabase
      .from("WorkDay")
      .select("date, totalMinutes, firstClockIn, lastClockOut, breakMinutes, location:Location(category, code)")
      .eq("userId", user!.id)
      .gte("date", format(startDate, "yyyy-MM-dd"))
      .order("date", { ascending: true })

    // Fetch previous period for comparison
    const { data: prevWorkDays } = await supabase
      .from("WorkDay")
      .select("date, totalMinutes, firstClockIn, lastClockOut, breakMinutes")
      .eq("userId", user!.id)
      .gte("date", format(prevStartDate, "yyyy-MM-dd"))
      .lte("date", format(prevEndDate, "yyyy-MM-dd"))

    // Fetch entries for more detail
    const { data: entries } = await supabase
      .from("Entry")
      .select("type, timestampServer, location:Location(category)")
      .eq("userId", user!.id)
      .gte("timestampServer", startDate.toISOString())
      .order("timestampServer", { ascending: true })

    // Current period stats
    const current = calculatePeriodStats(currentWorkDays || [], entries || [])
    const previous = calculatePeriodStats(prevWorkDays || [], [])

    // Calculate comparisons
    const comparison = {
      totalMinutes: calculateChange(current.totalMinutes, previous.totalMinutes),
      avgMinutesPerDay: calculateChange(current.avgMinutesPerDay, previous.avgMinutesPerDay),
      daysWorked: calculateChange(current.daysWorked, previous.daysWorked),
      avgClockIn: current.avgClockIn && previous.avgClockIn
        ? (current.avgClockIn - previous.avgClockIn)
        : null,
      avgClockOut: current.avgClockOut && previous.avgClockOut
        ? (current.avgClockOut - previous.avgClockOut)
        : null,
    }

    // Clock-in time distribution (histogram)
    const clockInDistribution = new Array(24).fill(0)
    const clockOutDistribution = new Array(24).fill(0)
    for (const wd of currentWorkDays || []) {
      if (wd.firstClockIn) {
        const hour = getHours(new Date(wd.firstClockIn))
        clockInDistribution[hour]++
      }
      if (wd.lastClockOut) {
        const hour = getHours(new Date(wd.lastClockOut))
        clockOutDistribution[hour]++
      }
    }

    // Day of week distribution
    const dayDistribution: Record<number, { count: number; minutes: number }> = {}
    for (let i = 0; i < 7; i++) {
      dayDistribution[i] = { count: 0, minutes: 0 }
    }
    for (const wd of currentWorkDays || []) {
      const dayOfWeek = getDay(new Date(wd.date))
      dayDistribution[dayOfWeek].count++
      dayDistribution[dayOfWeek].minutes += wd.totalMinutes || 0
    }

    // Location breakdown
    const locationBreakdown: Record<string, { days: number; minutes: number; category: string }> = {}
    for (const wd of currentWorkDays || []) {
      const loc = Array.isArray(wd.location) ? wd.location[0] : wd.location
      if (loc?.code) {
        if (!locationBreakdown[loc.code]) {
          locationBreakdown[loc.code] = { days: 0, minutes: 0, category: loc.category || "OFFICE" }
        }
        locationBreakdown[loc.code].days++
        locationBreakdown[loc.code].minutes += wd.totalMinutes || 0
      }
    }

    // Break stats
    const breakStats = {
      totalBreakMinutes: (currentWorkDays || []).reduce((sum, wd) => sum + (wd.breakMinutes || 0), 0),
      daysWithBreaks: (currentWorkDays || []).filter((wd) => (wd.breakMinutes || 0) > 0).length,
      avgBreakMinutes: 0,
    }
    if (breakStats.daysWithBreaks > 0) {
      breakStats.avgBreakMinutes = Math.round(breakStats.totalBreakMinutes / breakStats.daysWithBreaks)
    }

    // Overtime stats
    const overtimeStats = {
      overtimeDays: (currentWorkDays || []).filter((wd) => (wd.totalMinutes || 0) > 480).length,
      totalOvertimeMinutes: (currentWorkDays || []).reduce((sum, wd) => {
        const ot = (wd.totalMinutes || 0) - 480
        return sum + (ot > 0 ? ot : 0)
      }, 0),
      maxDayMinutes: Math.max(...(currentWorkDays || []).map((wd) => wd.totalMinutes || 0), 0),
    }

    // Punctuality (assuming 9am target)
    const punctualityStats = {
      onTime: 0, // before 9:15
      late: 0, // 9:15 - 10:00
      veryLate: 0, // after 10:00
    }
    for (const wd of currentWorkDays || []) {
      if (wd.firstClockIn) {
        const hour = getHours(new Date(wd.firstClockIn))
        const minutes = new Date(wd.firstClockIn).getMinutes()
        const totalMinuteOfDay = hour * 60 + minutes
        if (totalMinuteOfDay <= 9 * 60 + 15) {
          punctualityStats.onTime++
        } else if (totalMinuteOfDay <= 10 * 60) {
          punctualityStats.late++
        } else {
          punctualityStats.veryLate++
        }
      }
    }

    // Daily trend for chart
    const dailyTrend = (currentWorkDays || []).map((wd) => ({
      date: wd.date,
      minutes: wd.totalMinutes || 0,
      breakMinutes: wd.breakMinutes || 0,
      clockIn: wd.firstClockIn ? format(new Date(wd.firstClockIn), "HH:mm") : null,
      clockOut: wd.lastClockOut ? format(new Date(wd.lastClockOut), "HH:mm") : null,
    }))

    // Productivity score (0-100)
    const productivityScore = calculateProductivityScore({
      avgMinutesPerDay: current.avgMinutesPerDay,
      daysWorked: current.daysWorked,
      expectedDays: period === "week" ? 5 : period === "month" ? 22 : 66,
      punctualityRate: current.daysWorked > 0 ? punctualityStats.onTime / current.daysWorked : 0,
      breakUsageRate: current.daysWorked > 0 ? breakStats.daysWithBreaks / current.daysWorked : 0,
    })

    return NextResponse.json({
      period,
      current,
      previous,
      comparison,
      clockInDistribution,
      clockOutDistribution,
      dayDistribution,
      locationBreakdown,
      breakStats,
      overtimeStats,
      punctualityStats,
      dailyTrend,
      productivityScore,
    })
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}

interface WorkDay {
  date: string
  totalMinutes: number | null
  firstClockIn: string | null
  lastClockOut: string | null
  breakMinutes?: number | null
}

interface Entry {
  type: string
  timestampServer: string
}

function calculatePeriodStats(workDays: WorkDay[], entries: Entry[]) {
  const totalMinutes = workDays.reduce((sum, wd) => sum + (wd.totalMinutes || 0), 0)
  const daysWorked = workDays.length
  const avgMinutesPerDay = daysWorked > 0 ? Math.round(totalMinutes / daysWorked) : 0

  // Average clock-in/out times
  let clockInSum = 0
  let clockInCount = 0
  let clockOutSum = 0
  let clockOutCount = 0

  for (const wd of workDays) {
    if (wd.firstClockIn) {
      const d = new Date(wd.firstClockIn)
      clockInSum += d.getHours() * 60 + d.getMinutes()
      clockInCount++
    }
    if (wd.lastClockOut) {
      const d = new Date(wd.lastClockOut)
      clockOutSum += d.getHours() * 60 + d.getMinutes()
      clockOutCount++
    }
  }

  const avgClockIn = clockInCount > 0 ? Math.round(clockInSum / clockInCount) : null
  const avgClockOut = clockOutCount > 0 ? Math.round(clockOutSum / clockOutCount) : null

  // Full days (8+ hours)
  const fullDays = workDays.filter((wd) => (wd.totalMinutes || 0) >= 480).length

  return {
    totalMinutes,
    daysWorked,
    avgMinutesPerDay,
    avgClockIn, // minutes from midnight
    avgClockOut,
    fullDays,
    totalHours: Math.round(totalMinutes / 60),
  }
}

function calculateChange(current: number, previous: number): { value: number; percent: number } {
  const value = current - previous
  const percent = previous > 0 ? Math.round((value / previous) * 100) : current > 0 ? 100 : 0
  return { value, percent }
}

function calculateProductivityScore(params: {
  avgMinutesPerDay: number
  daysWorked: number
  expectedDays: number
  punctualityRate: number
  breakUsageRate: number
}): number {
  // Weight each factor
  const hoursScore = Math.min(100, (params.avgMinutesPerDay / 480) * 40) // 40% weight, target 8h
  const attendanceScore = Math.min(100, (params.daysWorked / params.expectedDays) * 30) // 30% weight
  const punctualityScore = params.punctualityRate * 20 // 20% weight
  const breakScore = params.breakUsageRate * 10 // 10% weight (taking breaks is good!)

  return Math.round(hoursScore + attendanceScore + punctualityScore + breakScore)
}
