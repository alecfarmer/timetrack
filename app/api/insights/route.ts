import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { startOfWeek, endOfWeek, subWeeks, format } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { getRequestTimezone } from "@/lib/validations"

// GET /api/insights - KPI insights and trends for dashboard
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 })
    }

    const userId = user!.id
    const tz = getRequestTimezone(request)
    const now = new Date()
    const zonedNow = toZonedTime(now, tz)

    // Get date ranges for current and previous weeks
    const thisWeekStart = startOfWeek(zonedNow, { weekStartsOn: 1 }) // Monday
    const thisWeekEnd = endOfWeek(zonedNow, { weekStartsOn: 1 })
    const lastWeekStart = subWeeks(thisWeekStart, 1)
    const lastWeekEnd = subWeeks(thisWeekEnd, 1)
    const fourWeeksAgo = subWeeks(thisWeekStart, 4)

    // Run queries in parallel
    const [thisWeekResult, lastWeekResult, fourWeekResult, entriesResult] = await Promise.all([
      // This week's workdays
      supabase
        .from("WorkDay")
        .select("date, totalMinutes, meetsPolicy")
        .eq("userId", userId)
        .gte("date", format(thisWeekStart, "yyyy-MM-dd"))
        .lte("date", format(thisWeekEnd, "yyyy-MM-dd"))
        .order("date", { ascending: true }),

      // Last week's workdays
      supabase
        .from("WorkDay")
        .select("date, totalMinutes")
        .eq("userId", userId)
        .gte("date", format(lastWeekStart, "yyyy-MM-dd"))
        .lte("date", format(lastWeekEnd, "yyyy-MM-dd")),

      // Last 4 weeks for trend
      supabase
        .from("WorkDay")
        .select("date, totalMinutes")
        .eq("userId", userId)
        .gte("date", format(fourWeeksAgo, "yyyy-MM-dd"))
        .lte("date", format(thisWeekEnd, "yyyy-MM-dd"))
        .order("date", { ascending: true }),

      // This week's entries for on-time calculation
      supabase
        .from("Entry")
        .select("type, timestampServer")
        .eq("userId", userId)
        .eq("type", "CLOCK_IN")
        .gte("timestampServer", thisWeekStart.toISOString())
        .lte("timestampServer", thisWeekEnd.toISOString())
        .order("timestampServer", { ascending: true }),
    ])

    const thisWeekDays = thisWeekResult.data || []
    const lastWeekDays = lastWeekResult.data || []
    const allDays = fourWeekResult.data || []
    const clockIns = entriesResult.data || []

    // Calculate weekly breakdown
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const todayStr = format(zonedNow, "yyyy-MM-dd")
    const weeklyBreakdown = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(thisWeekStart)
      date.setDate(date.getDate() + i)
      const dateStr = format(date, "yyyy-MM-dd")
      const dayData = thisWeekDays.find((d) => d.date === dateStr)
      weeklyBreakdown.push({
        date: dateStr,
        hours: (dayData?.totalMinutes || 0) / 60,
        isToday: dateStr === todayStr,
      })
    }

    // Calculate totals
    const totalHoursThisWeek = thisWeekDays.reduce((sum, d) => sum + (d.totalMinutes || 0), 0) / 60
    const totalHoursLastWeek = lastWeekDays.reduce((sum, d) => sum + (d.totalMinutes || 0), 0) / 60

    // Calculate averages
    const daysWithHoursThisWeek = thisWeekDays.filter((d) => d.totalMinutes > 0).length || 1
    const daysWithHoursLastWeek = lastWeekDays.filter((d) => d.totalMinutes > 0).length || 1
    const avgHoursPerDay = totalHoursThisWeek / daysWithHoursThisWeek
    const prevAvgHoursPerDay = totalHoursLastWeek / daysWithHoursLastWeek

    // Calculate 4-week trend (total hours per week)
    const weeklyTotals: number[] = []
    for (let w = 0; w < 4; w++) {
      const weekStart = subWeeks(thisWeekStart, 3 - w)
      const weekEnd = subWeeks(thisWeekEnd, 3 - w)
      const weekDays = allDays.filter((d) => {
        const date = new Date(d.date)
        return date >= weekStart && date <= weekEnd
      })
      const total = weekDays.reduce((sum, d) => sum + (d.totalMinutes || 0), 0) / 60
      weeklyTotals.push(Math.round(total * 10) / 10)
    }

    // Calculate on-time rate (clock-ins before 9 AM)
    const onTimeClockIns = clockIns.filter((e) => {
      const hour = toZonedTime(new Date(e.timestampServer), tz).getHours()
      return hour < 9
    })
    const onTimeRate = clockIns.length > 0
      ? Math.round((onTimeClockIns.length / clockIns.length) * 100)
      : 100

    // Calculate overtime hours
    const overtimeHours = Math.max(0, totalHoursThisWeek - 40)

    // Find most productive day (day with most hours this week)
    const dayTotals = thisWeekDays.reduce((acc, d) => {
      const date = new Date(d.date)
      const dayIdx = (date.getDay() + 6) % 7 // Convert to Mon=0
      acc[dayIdx] = (acc[dayIdx] || 0) + (d.totalMinutes || 0)
      return acc
    }, {} as Record<number, number>)

    let mostProductiveDay = "Monday"
    let maxMinutes = 0
    Object.entries(dayTotals).forEach(([idx, minutes]) => {
      if (minutes > maxMinutes) {
        maxMinutes = minutes
        mostProductiveDay = dayNames[parseInt(idx)]
      }
    })

    // Calculate productivity score (based on meeting daily targets)
    const daysMetTarget = thisWeekDays.filter((d) => d.totalMinutes >= 480).length // 8 hours
    const productivityScore = Math.round((daysMetTarget / Math.max(daysWithHoursThisWeek, 1)) * 100)

    // Count breaks taken
    const breaksTaken = 0 // Would need to query Entry for BREAK_START/END

    return NextResponse.json({
      weeklyBreakdown,
      avgHoursPerDay: Math.round(avgHoursPerDay * 10) / 10,
      prevAvgHoursPerDay: Math.round(prevAvgHoursPerDay * 10) / 10,
      totalHoursThisWeek: Math.round(totalHoursThisWeek * 10) / 10,
      totalHoursLastWeek: Math.round(totalHoursLastWeek * 10) / 10,
      productivityScore,
      onTimeRate,
      breaksTaken,
      overtimeHours: Math.round(overtimeHours * 10) / 10,
      mostProductiveDay,
      trend: weeklyTotals,
    })
  } catch (error) {
    console.error("Insights error:", error)
    return NextResponse.json({ error: "Failed to load insights" }, { status: 500 })
  }
}
