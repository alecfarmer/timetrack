import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from "date-fns"
import { toZonedTime } from "date-fns-tz"

const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || "America/New_York"

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

    // Get all work days in this week
    const workDays = await prisma.workDay.findMany({
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

    // Get active policy
    const policy = await prisma.policyConfig.findFirst({
      where: { isActive: true },
      orderBy: { effectiveDate: "desc" },
    })

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
