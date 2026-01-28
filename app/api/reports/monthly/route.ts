import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachWeekOfInterval } from "date-fns"
import { toZonedTime } from "date-fns-tz"

const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || "America/New_York"

export async function GET(request: NextRequest) {
  try {
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

    const zonedDate = toZonedTime(targetDate, DEFAULT_TIMEZONE)
    const monthStart = startOfMonth(zonedDate)
    const monthEnd = endOfMonth(zonedDate)

    // Get all weeks in the month
    const weeksInMonth = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { weekStartsOn: 1 }
    )

    // Fetch policy
    const policy = await prisma.policyConfig.findFirst({
      where: { isActive: true },
      orderBy: { effectiveDate: "desc" },
    })

    const requiredDays = policy?.requiredDaysPerWeek || 3

    // Fetch all workdays in the month
    const workDays = await prisma.workDay.findMany({
      where: {
        date: {
          gte: monthStart,
          lte: monthEnd,
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

    // Calculate weekly compliance
    let weeksCompliant = 0
    const weeklyBreakdown = weeksInMonth.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

      // Only count weeks that fall within the month
      const effectiveStart = weekStart < monthStart ? monthStart : weekStart
      const effectiveEnd = weekEnd > monthEnd ? monthEnd : weekEnd

      const daysInWeek = workDays.filter((wd) => {
        const wdDate = new Date(wd.date)
        return wdDate >= effectiveStart && wdDate <= effectiveEnd
      })

      const daysWorked = daysInWeek.length
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

    // Calculate totals
    const totalDaysWorked = workDays.length
    const totalMinutes = workDays.reduce((sum, wd) => sum + (wd.totalMinutes || 0), 0)

    // Group by location
    const byLocation = workDays.reduce((acc, wd) => {
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
