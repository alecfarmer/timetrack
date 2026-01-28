import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from "date-fns"
import { toZonedTime } from "date-fns-tz"

const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || "America/New_York"

// Generate demo week data
function getDemoWeekData() {
  const now = new Date()
  const zonedNow = toZonedTime(now, DEFAULT_TIMEZONE)
  const weekStart = startOfWeek(zonedNow, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(zonedNow, { weekStartsOn: 1 })

  const allDaysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const weekDays = allDaysOfWeek.map((date) => ({
    date: format(date, "yyyy-MM-dd"),
    dayOfWeek: format(date, "EEE"),
    dayNumber: date.getDay(),
    worked: false,
    workDay: null,
  }))

  return {
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    daysWorked: 0,
    requiredDays: 3,
    isCompliant: false,
    totalMinutes: 0,
    weekDays,
    workDays: [],
  }
}

// GET /api/workdays/week - Get weekly summary
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get("date")

    const targetDate = dateParam ? new Date(dateParam) : new Date()
    const zonedDate = toZonedTime(targetDate, DEFAULT_TIMEZONE)

    // Get week boundaries (Monday to Sunday)
    const weekStart = startOfWeek(zonedDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(zonedDate, { weekStartsOn: 1 })

    // Try to fetch from database
    let workDays
    let policy
    try {
      workDays = await prisma.workDay.findMany({
        where: {
          date: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        include: {
          location: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: {
          date: "asc",
        },
      })

      policy = await prisma.policyConfig.findFirst({
        where: { isActive: true },
        orderBy: { effectiveDate: "desc" },
      })
    } catch {
      // Database not available, return demo data
      return NextResponse.json(getDemoWeekData())
    }

    const requiredDays = policy?.requiredDaysPerWeek || 3

    // Create a map of dates that have work recorded
    const workedDates = new Set(
      workDays
        .filter((wd) => wd.meetsPolicy)
        .map((wd) => format(wd.date, "yyyy-MM-dd"))
    )

    // Generate all days of the week with their status
    const allDaysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const weekDays = allDaysOfWeek.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd")
      const workDay = workDays.find(
        (wd) => format(wd.date, "yyyy-MM-dd") === dateStr
      )

      return {
        date: dateStr,
        dayOfWeek: format(date, "EEE"),
        dayNumber: date.getDay(),
        worked: workedDates.has(dateStr),
        workDay: workDay || null,
      }
    })

    // Count days worked (only weekdays Mon-Fri typically count for policy)
    const daysWorked = weekDays
      .filter((d) => d.dayNumber >= 1 && d.dayNumber <= 5) // Mon-Fri
      .filter((d) => d.worked).length

    // Calculate total minutes for the week
    const totalMinutes = workDays.reduce(
      (sum, wd) => sum + (wd.totalMinutes || 0),
      0
    )

    return NextResponse.json({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      daysWorked,
      requiredDays,
      isCompliant: daysWorked >= requiredDays,
      totalMinutes,
      weekDays,
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
