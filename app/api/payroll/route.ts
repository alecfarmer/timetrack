import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { getRequestTimezone } from "@/lib/validations"
const REGULAR_HOURS_PER_WEEK = 40
const REGULAR_MINUTES_PER_WEEK = REGULAR_HOURS_PER_WEEK * 60

// GET /api/payroll?month=2025-01 - Generate payroll timesheet
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const params = request.nextUrl.searchParams
    const monthParam = params.get("month") // YYYY-MM
    const exportCsv = params.get("format") === "csv"

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

    // Fetch all workdays for the month
    const { data: workDays } = await supabase
      .from("WorkDay")
      .select("*, location:Location (id, name, code, category)")
      .eq("userId", user!.id)
      .gte("date", format(monthStart, "yyyy-MM-dd"))
      .lte("date", format(monthEnd, "yyyy-MM-dd"))
      .order("date", { ascending: true })

    // Fetch callouts for overtime
    const { data: callouts } = await supabase
      .from("Callout")
      .select("*, location:Location (id, name, code, category)")
      .eq("userId", user!.id)
      .gte("timeReceived", monthStart.toISOString())
      .lte("timeReceived", monthEnd.toISOString())

    // Fetch leave for the month
    const { data: leaves } = await supabase
      .from("LeaveRequest")
      .select("*")
      .eq("userId", user!.id)
      .gte("date", format(monthStart, "yyyy-MM-dd"))
      .lte("date", format(monthEnd, "yyyy-MM-dd"))

    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 })
    const workDayMap = new Map((workDays || []).map((wd) => [wd.date, wd]))
    const leaveMap = new Map((leaves || []).map((l) => [l.date, l]))

    // Calculate callout minutes per week
    const calloutMinutesByWeek = new Map<string, number>()
    for (const callout of callouts || []) {
      if (callout.timeStarted && callout.timeEnded) {
        const mins = Math.floor(
          (new Date(callout.timeEnded).getTime() - new Date(callout.timeStarted).getTime()) / 60000
        )
        const weekStart = format(
          startOfWeek(new Date(callout.timeReceived), { weekStartsOn: 1 }),
          "yyyy-MM-dd"
        )
        calloutMinutesByWeek.set(weekStart, (calloutMinutesByWeek.get(weekStart) || 0) + mins)
      }
    }

    const weeklyTimesheets = weeks.map((weekStartDate) => {
      const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 })
      const effectiveStart = weekStartDate < monthStart ? monthStart : weekStartDate
      const effectiveEnd = weekEndDate > monthEnd ? monthEnd : weekEndDate
      const days = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd })
      const weekKey = format(weekStartDate, "yyyy-MM-dd")

      let regularMinutes = 0
      let onsiteMinutes = 0
      let wfhMinutes = 0
      let leaveDays = 0
      const dailyBreakdown = days.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd")
        const wd = workDayMap.get(dateStr)
        const leave = leaveMap.get(dateStr)
        const loc = wd?.location
          ? Array.isArray(wd.location) ? wd.location[0] : wd.location
          : null

        const mins = wd?.totalMinutes || 0
        regularMinutes += mins
        if (loc?.category === "HOME") {
          wfhMinutes += mins
        } else if (mins > 0) {
          onsiteMinutes += mins
        }
        if (leave) leaveDays++

        return {
          date: dateStr,
          dayName: format(day, "EEE"),
          totalMinutes: mins,
          location: loc?.code || null,
          category: loc?.category || null,
          isLeave: !!leave,
          leaveType: leave?.type || null,
        }
      })

      const calloutMinutes = calloutMinutesByWeek.get(weekKey) || 0
      const totalMinutes = regularMinutes + calloutMinutes
      const overtimeMinutes = Math.max(0, totalMinutes - REGULAR_MINUTES_PER_WEEK)
      const regularCapped = Math.min(regularMinutes, REGULAR_MINUTES_PER_WEEK)

      return {
        weekStart: format(weekStartDate, "yyyy-MM-dd"),
        weekEnd: format(weekEndDate, "yyyy-MM-dd"),
        regularMinutes: regularCapped,
        overtimeMinutes,
        calloutMinutes,
        onsiteMinutes,
        wfhMinutes,
        leaveDays,
        totalMinutes,
        dailyBreakdown,
      }
    })

    const totals = weeklyTimesheets.reduce(
      (acc, week) => ({
        regularMinutes: acc.regularMinutes + week.regularMinutes,
        overtimeMinutes: acc.overtimeMinutes + week.overtimeMinutes,
        calloutMinutes: acc.calloutMinutes + week.calloutMinutes,
        onsiteMinutes: acc.onsiteMinutes + week.onsiteMinutes,
        wfhMinutes: acc.wfhMinutes + week.wfhMinutes,
        leaveDays: acc.leaveDays + week.leaveDays,
        totalMinutes: acc.totalMinutes + week.totalMinutes,
      }),
      { regularMinutes: 0, overtimeMinutes: 0, calloutMinutes: 0, onsiteMinutes: 0, wfhMinutes: 0, leaveDays: 0, totalMinutes: 0 }
    )

    const result = {
      employee: user!.email,
      period: format(monthStart, "MMMM yyyy"),
      monthStart: format(monthStart, "yyyy-MM-dd"),
      monthEnd: format(monthEnd, "yyyy-MM-dd"),
      weeks: weeklyTimesheets,
      totals,
    }

    if (exportCsv) {
      const rows: string[] = []
      rows.push("OnSite Payroll Timesheet")
      rows.push(`Employee: ${user!.email}`)
      rows.push(`Period: ${result.period}`)
      rows.push("")
      rows.push("Date,Day,Location,Category,Regular Hours,Overtime Hours,Callout Hours,Leave")

      for (const week of weeklyTimesheets) {
        for (const day of week.dailyBreakdown) {
          const regH = day.totalMinutes > 0 ? (Math.min(day.totalMinutes, 480) / 60).toFixed(2) : "0.00"
          const otH = day.totalMinutes > 480 ? ((day.totalMinutes - 480) / 60).toFixed(2) : "0.00"
          rows.push(
            [
              day.date,
              day.dayName,
              day.location || "",
              day.category || "",
              regH,
              otH,
              "",
              day.isLeave ? day.leaveType : "",
            ].join(",")
          )
        }
      }

      rows.push("")
      rows.push(`Total Regular Hours,${(totals.regularMinutes / 60).toFixed(2)}`)
      rows.push(`Total Overtime Hours,${(totals.overtimeMinutes / 60).toFixed(2)}`)
      rows.push(`Total Callout Hours,${(totals.calloutMinutes / 60).toFixed(2)}`)
      rows.push(`Total Leave Days,${totals.leaveDays}`)
      rows.push(`Grand Total Hours,${(totals.totalMinutes / 60).toFixed(2)}`)

      return new NextResponse(rows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="Payroll_${format(monthStart, "yyyy_MM")}.csv"`,
        },
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Payroll error:", error)
    return NextResponse.json({ error: "Failed to generate payroll" }, { status: 500 })
  }
}
