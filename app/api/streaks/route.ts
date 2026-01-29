import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { format, subDays, differenceInCalendarDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earnedAt: string | null
}

// GET /api/streaks - Get user's streaks and achievements
export async function GET() {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    // Fetch all workdays for this user, ordered by date
    const { data: workDays } = await supabase
      .from("WorkDay")
      .select("date, totalMinutes, location:Location (category)")
      .eq("userId", user!.id)
      .order("date", { ascending: false })
      .limit(365)

    if (!workDays || workDays.length === 0) {
      return NextResponse.json({
        currentStreak: 0,
        longestStreak: 0,
        totalOnsiteDays: 0,
        totalHours: 0,
        thisMonthDays: 0,
        perfectWeeks: 0,
        badges: getEmptyBadges(),
      })
    }

    // Get on-site days only (exclude HOME)
    const onsiteDays = workDays
      .filter((wd) => {
        const loc = Array.isArray(wd.location) ? wd.location[0] : wd.location
        return loc?.category !== "HOME"
      })
      .map((wd) => wd.date)
      .sort()

    const onsiteDateSet = new Set(onsiteDays)

    // Calculate current streak (consecutive weekdays with on-site work)
    let currentStreak = 0
    let checkDate = new Date()
    // Start from today or yesterday depending on whether today has work
    const todayStr = format(checkDate, "yyyy-MM-dd")
    if (!onsiteDateSet.has(todayStr)) {
      checkDate = subDays(checkDate, 1)
    }

    while (true) {
      const dateStr = format(checkDate, "yyyy-MM-dd")
      const dayOfWeek = checkDate.getDay()

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        checkDate = subDays(checkDate, 1)
        continue
      }

      if (onsiteDateSet.has(dateStr)) {
        currentStreak++
        checkDate = subDays(checkDate, 1)
      } else {
        break
      }
    }

    // Calculate longest streak
    let longestStreak = 0
    let tempStreak = 0
    const sortedDates = [...onsiteDateSet].sort()

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1
      } else {
        const prev = new Date(sortedDates[i - 1])
        const curr = new Date(sortedDates[i])
        const diff = differenceInCalendarDays(curr, prev)

        // Allow weekends (diff of 3 for Fri->Mon)
        if (diff === 1 || (diff === 3 && prev.getDay() === 5)) {
          tempStreak++
        } else {
          tempStreak = 1
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak)
    }

    // This month stats
    const now = new Date()
    const monthStart = format(startOfMonth(now), "yyyy-MM-dd")
    const monthEnd = format(endOfMonth(now), "yyyy-MM-dd")
    const thisMonthDays = onsiteDays.filter((d) => d >= monthStart && d <= monthEnd).length

    // Total hours
    const totalMinutes = workDays.reduce((sum, wd) => sum + (wd.totalMinutes || 0), 0)
    const totalHours = Math.round(totalMinutes / 60)

    // Perfect weeks (3+ on-site days in a week)
    const weekMap = new Map<string, number>()
    for (const dateStr of onsiteDays) {
      const d = new Date(dateStr)
      // Get Monday of this week
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(d.getFullYear(), d.getMonth(), diff)
      const weekKey = format(monday, "yyyy-MM-dd")
      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1)
    }
    const perfectWeeks = [...weekMap.values()].filter((count) => count >= 3).length

    // Calculate badges
    const badges = calculateBadges({
      currentStreak,
      longestStreak,
      totalOnsiteDays: onsiteDays.length,
      totalHours,
      perfectWeeks,
      thisMonthDays,
    })

    return NextResponse.json({
      currentStreak,
      longestStreak,
      totalOnsiteDays: onsiteDays.length,
      totalHours,
      thisMonthDays,
      perfectWeeks,
      badges,
    })
  } catch (error) {
    console.error("Streaks error:", error)
    return NextResponse.json({ error: "Failed to fetch streaks" }, { status: 500 })
  }
}

interface Stats {
  currentStreak: number
  longestStreak: number
  totalOnsiteDays: number
  totalHours: number
  perfectWeeks: number
  thisMonthDays: number
}

function calculateBadges(stats: Stats): Badge[] {
  const now = new Date().toISOString()

  return [
    {
      id: "first_day",
      name: "First Day",
      description: "Clocked in for the first time",
      icon: "🎯",
      earnedAt: stats.totalOnsiteDays >= 1 ? now : null,
    },
    {
      id: "week_warrior",
      name: "Week Warrior",
      description: "5 consecutive on-site days",
      icon: "⚡",
      earnedAt: stats.longestStreak >= 5 ? now : null,
    },
    {
      id: "two_week_streak",
      name: "Unstoppable",
      description: "10 consecutive on-site days",
      icon: "🔥",
      earnedAt: stats.longestStreak >= 10 ? now : null,
    },
    {
      id: "month_master",
      name: "Month Master",
      description: "15+ on-site days in a month",
      icon: "🏆",
      earnedAt: stats.thisMonthDays >= 15 ? now : null,
    },
    {
      id: "perfect_week",
      name: "Perfect Week",
      description: "First week with 3+ on-site days",
      icon: "✅",
      earnedAt: stats.perfectWeeks >= 1 ? now : null,
    },
    {
      id: "ten_perfect",
      name: "Consistency King",
      description: "10 perfect weeks (3+ on-site days)",
      icon: "👑",
      earnedAt: stats.perfectWeeks >= 10 ? now : null,
    },
    {
      id: "hundred_hours",
      name: "Century Club",
      description: "100 total hours tracked",
      icon: "💯",
      earnedAt: stats.totalHours >= 100 ? now : null,
    },
    {
      id: "five_hundred_hours",
      name: "Dedicated",
      description: "500 total hours tracked",
      icon: "🌟",
      earnedAt: stats.totalHours >= 500 ? now : null,
    },
    {
      id: "thousand_hours",
      name: "Legend",
      description: "1,000 total hours tracked",
      icon: "🏅",
      earnedAt: stats.totalHours >= 1000 ? now : null,
    },
    {
      id: "fifty_days",
      name: "Half Century",
      description: "50 total on-site days",
      icon: "🎖️",
      earnedAt: stats.totalOnsiteDays >= 50 ? now : null,
    },
    {
      id: "hundred_days",
      name: "Centurion",
      description: "100 total on-site days",
      icon: "🏛️",
      earnedAt: stats.totalOnsiteDays >= 100 ? now : null,
    },
    {
      id: "two_fifty_days",
      name: "Iron Will",
      description: "250 total on-site days",
      icon: "💎",
      earnedAt: stats.totalOnsiteDays >= 250 ? now : null,
    },
  ]
}

function getEmptyBadges(): Badge[] {
  return calculateBadges({
    currentStreak: 0,
    longestStreak: 0,
    totalOnsiteDays: 0,
    totalHours: 0,
    perfectWeeks: 0,
    thisMonthDays: 0,
  })
}
