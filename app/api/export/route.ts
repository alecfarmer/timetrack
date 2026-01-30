import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { getRequestTimezone } from "@/lib/validations"

// GET /api/export?format=csv&period=weekly&date=2025-01-20
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const params = request.nextUrl.searchParams
    const exportFormat = params.get("format") || "csv"
    const period = params.get("period") || "weekly"
    const dateParam = params.get("date")

    const targetDate = dateParam ? new Date(dateParam) : new Date()
    const zonedDate = toZonedTime(targetDate, getRequestTimezone(request))

    let start: Date, end: Date, periodLabel: string
    if (period === "monthly") {
      start = startOfMonth(zonedDate)
      end = endOfMonth(zonedDate)
      periodLabel = format(start, "MMMM_yyyy")
    } else {
      start = startOfWeek(zonedDate, { weekStartsOn: 1 })
      end = endOfWeek(zonedDate, { weekStartsOn: 1 })
      periodLabel = `Week_${format(start, "MMM_dd")}_${format(end, "MMM_dd_yyyy")}`
    }

    // Fetch workdays with location
    const { data: workDays } = await supabase
      .from("WorkDay")
      .select("*, location:Location (id, name, code, category)")
      .eq("userId", user!.id)
      .gte("date", format(start, "yyyy-MM-dd"))
      .lte("date", format(end, "yyyy-MM-dd"))
      .order("date", { ascending: true })

    // Fetch entries for detailed export
    const { data: entries } = await supabase
      .from("Entry")
      .select("*, location:Location (id, name, code, category)")
      .eq("userId", user!.id)
      .gte("timestampServer", start.toISOString())
      .lte("timestampServer", end.toISOString())
      .order("timestampServer", { ascending: true })

    // Fetch leave requests
    const { data: leaves } = await supabase
      .from("LeaveRequest")
      .select("*")
      .eq("userId", user!.id)
      .gte("date", format(start, "yyyy-MM-dd"))
      .lte("date", format(end, "yyyy-MM-dd"))

    const allDays = eachDayOfInterval({ start, end })
    const workDayMap = new Map((workDays || []).map((wd) => [wd.date, wd]))
    const leaveMap = new Map((leaves || []).map((l) => [l.date, l]))

    if (exportFormat === "csv") {
      const rows: string[] = []
      rows.push("Date,Day,Location,Category,Hours,Minutes,Status,Leave Type,Notes")

      for (const day of allDays) {
        const dateStr = format(day, "yyyy-MM-dd")
        const dayName = format(day, "EEEE")
        const wd = workDayMap.get(dateStr)
        const leave = leaveMap.get(dateStr)

        const loc = wd?.location
          ? Array.isArray(wd.location) ? wd.location[0] : wd.location
          : null

        const hours = wd?.totalMinutes ? Math.floor(wd.totalMinutes / 60) : 0
        const mins = wd?.totalMinutes ? wd.totalMinutes % 60 : 0
        const status = leave
          ? `Leave (${leave.type})`
          : wd?.totalMinutes
          ? wd.totalMinutes >= 480 ? "Full Day" : "Partial"
          : "No Work"

        rows.push(
          [
            dateStr,
            dayName,
            loc?.code || loc?.name || "",
            loc?.category || "",
            hours,
            mins,
            status,
            leave?.type || "",
            leave?.notes?.replace(/,/g, ";") || "",
          ].join(",")
        )
      }

      // Summary rows
      const totalMinutes = (workDays || []).reduce((sum, wd) => sum + (wd.totalMinutes || 0), 0)
      const onsiteDays = (workDays || []).filter(
        (wd) => (Array.isArray(wd.location) ? wd.location[0] : wd.location)?.category !== "HOME"
      ).length
      const leaveDays = (leaves || []).length

      rows.push("")
      rows.push(`Total Hours,${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`)
      rows.push(`On-Site Days,${onsiteDays}`)
      rows.push(`Leave Days,${leaveDays}`)

      const csv = rows.join("\n")
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="OnSite_${periodLabel}.csv"`,
        },
      })
    }

    // JSON export (for PDF generation on client side)
    const dayData = allDays.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd")
      const wd = workDayMap.get(dateStr)
      const leave = leaveMap.get(dateStr)
      const loc = wd?.location
        ? Array.isArray(wd.location) ? wd.location[0] : wd.location
        : null

      return {
        date: dateStr,
        dayName: format(day, "EEEE"),
        location: loc?.code || loc?.name || null,
        category: loc?.category || null,
        totalMinutes: wd?.totalMinutes || 0,
        leave: leave ? { type: leave.type, notes: leave.notes } : null,
      }
    })

    const totalMinutes = (workDays || []).reduce((sum, wd) => sum + (wd.totalMinutes || 0), 0)
    const onsiteDays = (workDays || []).filter(
      (wd) => (Array.isArray(wd.location) ? wd.location[0] : wd.location)?.category !== "HOME"
    ).length

    return NextResponse.json({
      period: periodLabel,
      start: format(start, "yyyy-MM-dd"),
      end: format(end, "yyyy-MM-dd"),
      days: dayData,
      summary: {
        totalMinutes,
        onsiteDays,
        wfhDays: (workDays || []).length - onsiteDays,
        leaveDays: (leaves || []).length,
        totalDaysWorked: (workDays || []).length,
      },
      entries: (entries || []).map((e) => ({
        date: format(new Date(e.timestampServer), "yyyy-MM-dd"),
        time: format(new Date(e.timestampServer), "HH:mm:ss"),
        type: e.type,
        location: (Array.isArray(e.location) ? e.location[0] : e.location)?.code || "",
      })),
      userName: user!.email,
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Failed to generate export" }, { status: 500 })
  }
}
