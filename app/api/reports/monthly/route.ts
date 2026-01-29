import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { startOfMonth, endOfMonth, endOfWeek, eachWeekOfInterval, format } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { getRequestTimezone } from "@/lib/validations"

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const searchParams = request.nextUrl.searchParams
    const monthParam = searchParams.get("month") // Format: YYYY-MM

    const now = new Date()
    let targetDate: Date

    if (monthParam) {
      const [year, month] = monthParam.split("-").map(Number)
      targetDate = new Date(year, month - 1, 1)
    } else {
      targetDate = now
    }

    const zonedDate = toZonedTime(targetDate, getRequestTimezone(request))
    const monthStart = startOfMonth(zonedDate)
    const monthEnd = endOfMonth(zonedDate)

    // Get all weeks in the month
    const weeksInMonth = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { weekStartsOn: 1 }
    )

    // Fetch policy
    const { data: policy } = await supabase
      .from("PolicyConfig")
      .select("*")
      .eq("isActive", true)
      .order("effectiveDate", { ascending: false })
      .limit(1)
      .single()

    const requiredDays = policy?.requiredDaysPerWeek || 3

    // Fetch all workdays in the month for this user
    const { data: workDays, error } = await supabase
      .from("WorkDay")
      .select(`
        *,
        location:Location (id, name, code, category)
      `)
      .eq("userId", user!.id)
      .gte("date", format(monthStart, "yyyy-MM-dd"))
      .lte("date", format(monthEnd, "yyyy-MM-dd"))
      .order("date", { ascending: true })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to fetch monthly report", details: error.message },
        { status: 500 }
      )
    }

    // Calculate weekly compliance
    let weeksCompliant = 0
    const weeklyBreakdown = weeksInMonth.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

      // Only count weeks that fall within the month
      const effectiveStart = weekStart < monthStart ? monthStart : weekStart
      const effectiveEnd = weekEnd > monthEnd ? monthEnd : weekEnd

      const daysInWeek = (workDays || []).filter((wd) => {
        const wdDate = new Date(wd.date)
        return wdDate >= effectiveStart && wdDate <= effectiveEnd
      })

      // Only count non-HOME category locations toward compliance (in-office requirement)
      const daysWorked = daysInWeek.filter((wd) => wd.location?.category !== "HOME").length
      const isCompliant = daysWorked >= requiredDays
      const totalMinutes = daysInWeek.reduce((sum, wd) => sum + (wd.totalMinutes || 0), 0)

      if (isCompliant) {
        weeksCompliant++
      }

      return {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        daysWorked,
        requiredDays,
        isCompliant,
        totalMinutes,
      }
    })

    // Calculate totals (only non-HOME for compliance, all for total time)
    const totalDaysWorked = (workDays || []).filter((wd) => wd.location?.category !== "HOME").length
    const totalMinutes = (workDays || []).reduce((sum, wd) => sum + (wd.totalMinutes || 0), 0)

    // Group by location
    const byLocation = (workDays || []).reduce((acc, wd) => {
      if (!wd.location) return acc
      const code = wd.location.code ?? wd.location.name ?? "Unknown"
      if (!acc[code]) {
        acc[code] = { days: 0, minutes: 0 }
      }
      acc[code].days++
      acc[code].minutes += wd.totalMinutes || 0
      return acc
    }, {} as Record<string, { days: number; minutes: number }>)

    return NextResponse.json({
      month: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
      weeksCompliant,
      totalWeeks: weeksInMonth.length,
      totalDaysWorked,
      totalMinutes,
      requiredDaysPerWeek: requiredDays,
      weeklyBreakdown,
      byLocation,
    })
  } catch (error) {
    console.error("Error fetching monthly report:", error)
    return NextResponse.json(
      { error: "Failed to fetch monthly report" },
      { status: 500 }
    )
  }
}
