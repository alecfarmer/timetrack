import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { getRequestTimezone } from "@/lib/validations"

// GET /api/workdays/week - Get weekly summary
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get("date")

    const targetDate = dateParam ? new Date(dateParam) : new Date()
    const zonedDate = toZonedTime(targetDate, getRequestTimezone(request))

    // Get week boundaries (Monday to Sunday)
    const weekStart = startOfWeek(zonedDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(zonedDate, { weekStartsOn: 1 })

    const { data: workDays, error } = await supabase
      .from("WorkDay")
      .select(`
        *,
        location:Location (id, name, code, category)
      `)
      .eq("userId", user!.id)
      .gte("date", weekStart.toISOString().split("T")[0])
      .lte("date", weekEnd.toISOString().split("T")[0])
      .order("date", { ascending: true })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to fetch weekly summary", details: error.message },
        { status: 500 }
      )
    }

    let policyQuery = supabase
      .from("PolicyConfig")
      .select("*")
      .eq("isActive", true)
      .order("effectiveDate", { ascending: false })
      .limit(1)

    if (org) {
      policyQuery = policyQuery.eq("orgId", org.orgId)
    }

    const { data: policy } = await policyQuery.single()

    const requiredDays = policy?.requiredDaysPerWeek || 3

    // Create a map of dates that have work recorded
    // Only count non-HOME category locations toward compliance (in-office requirement)
    const workedDates = new Set(
      (workDays || [])
        .filter((wd) => wd.meetsPolicy && wd.location?.category !== "HOME")
        .map((wd) => wd.date)
    )

    // Generate all days of the week with their status
    const allDaysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const weekDaysData = allDaysOfWeek.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd")
      const workDay = (workDays || []).find((wd) => wd.date === dateStr)
      const loc = workDay?.location
        ? Array.isArray(workDay.location) ? workDay.location[0] : workDay.location
        : null

      return {
        date: dateStr,
        dayOfWeek: format(date, "EEE"),
        dayNumber: date.getDay(),
        worked: workedDates.has(dateStr),
        minutes: workDay?.totalMinutes || 0,
        locationCode: loc?.code || loc?.name || null,
        locationCategory: loc?.category || null,
        workDay: workDay || null,
      }
    })

    // Count days worked (only weekdays Mon-Fri typically count for policy)
    const daysWorked = weekDaysData
      .filter((d) => d.dayNumber >= 1 && d.dayNumber <= 5) // Mon-Fri
      .filter((d) => d.worked).length

    // Calculate total minutes for the week
    const totalMinutes = (workDays || []).reduce(
      (sum, wd) => sum + (wd.totalMinutes || 0),
      0
    )

    const requiredMinutesPerWeek = 40 * 60 // 40 hours
    const hoursOnTrack = totalMinutes >= requiredMinutesPerWeek

    return NextResponse.json({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      daysWorked,
      requiredDays,
      isCompliant: daysWorked >= requiredDays,
      totalMinutes,
      requiredMinutesPerWeek,
      hoursOnTrack,
      weekDays: weekDaysData,
      workDays,
    })
  } catch (error) {
    console.error("Error fetching weekly summary:", error)
    return NextResponse.json(
      { error: "Failed to fetch weekly summary" },
      { status: 500 }
    )
  }
}
