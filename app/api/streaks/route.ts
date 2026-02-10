import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { format, subDays, differenceInCalendarDays, startOfMonth, endOfMonth, startOfWeek, getDay, getHours } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { getRequestTimezone } from "@/lib/validations"

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: "streak" | "milestone" | "special" | "time" | "consistency"
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
  xp: number
  earnedAt: string | null
  progress?: number
  target?: number
}

interface Challenge {
  id: string
  name: string
  description: string
  icon: string
  type: "daily" | "weekly" | "monthly"
  target: number
  progress: number
  xpReward: number
  expiresAt: string
  completed: boolean
}

interface Level {
  level: number
  name: string
  minXp: number
  maxXp: number
}

const LEVELS: Level[] = [
  { level: 1, name: "Newcomer", minXp: 0, maxXp: 100 },
  { level: 2, name: "Regular", minXp: 100, maxXp: 250 },
  { level: 3, name: "Committed", minXp: 250, maxXp: 500 },
  { level: 4, name: "Dedicated", minXp: 500, maxXp: 1000 },
  { level: 5, name: "Reliable", minXp: 1000, maxXp: 2000 },
  { level: 6, name: "Standout", minXp: 2000, maxXp: 3500 },
  { level: 7, name: "Star", minXp: 3500, maxXp: 5500 },
  { level: 8, name: "Champion", minXp: 5500, maxXp: 8000 },
  { level: 9, name: "Elite", minXp: 8000, maxXp: 12000 },
  { level: 10, name: "Legend", minXp: 12000, maxXp: 999999 },
]

// GET /api/streaks - Get user's streaks, achievements, XP and challenges
// Optimized: Uses 90-day window for recent data, separate count query for totals
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const timezone = getRequestTimezone(request)
    const userId = user!.id
    const now = new Date()
    const ninetyDaysAgo = format(subDays(now, 90), "yyyy-MM-dd")

    // Run optimized queries in parallel
    const [recentWorkDaysResult, totalStatsResult] = await Promise.all([
      // Recent workdays for streak calculation (90 days)
      supabase
        .from("WorkDay")
        .select("date, totalMinutes, firstClockIn, lastClockOut, breakMinutes, location:Location(category)")
        .eq("userId", userId)
        .gte("date", ninetyDaysAgo)
        .order("date", { ascending: false }),

      // Aggregate totals in a single query (more efficient)
      supabase
        .from("WorkDay")
        .select("date, totalMinutes, firstClockIn, lastClockOut, breakMinutes, location:Location(category)")
        .eq("userId", userId)
        .order("date", { ascending: false }),
    ])

    const recentWorkDays = recentWorkDaysResult.data || []
    const allWorkDays = totalStatsResult.data || []

    if (allWorkDays.length === 0) {
      return NextResponse.json({
        currentStreak: 0,
        longestStreak: 0,
        totalOnsiteDays: 0,
        totalHours: 0,
        thisMonthDays: 0,
        perfectWeeks: 0,
        badges: getEmptyBadges(),
        xp: 0,
        level: LEVELS[0],
        nextLevel: LEVELS[1],
        xpProgress: 0,
        xpToNext: 100,
        challenges: generateChallenges(0, 0, 0, timezone),
        stats: {
          earlyBirdCount: 0,
          nightOwlCount: 0,
          onTimeCount: 0,
          breaksTaken: 0,
          weekendDays: 0,
          fullDays: 0,
          overtimeDays: 0,
          avgClockIn: null,
        },
      })
    }

    // Filter on-site days
    const filterOnsite = (days: typeof allWorkDays) =>
      days.filter((wd) => {
        const loc = Array.isArray(wd.location) ? wd.location[0] : wd.location
        return loc?.category !== "HOME"
      })

    const recentOnsiteDays = filterOnsite(recentWorkDays).map((wd) => wd.date)
    const allOnsiteDays = filterOnsite(allWorkDays).map((wd) => wd.date)
    const onsiteDateSet = new Set(recentOnsiteDays)
    const allOnsiteDateSet = new Set(allOnsiteDays)

    // Calculate current streak (only need recent data)
    let currentStreak = 0
    let checkDate = toZonedTime(now, timezone)
    const todayStr = format(checkDate, "yyyy-MM-dd")
    if (!onsiteDateSet.has(todayStr)) {
      checkDate = subDays(checkDate, 1)
    }

    for (let i = 0; i < 60; i++) {
      const dateStr = format(checkDate, "yyyy-MM-dd")
      const dayOfWeek = checkDate.getDay()

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

    // Calculate longest streak from all data
    let longestStreak = 0
    let tempStreak = 0
    const sortedDates = [...allOnsiteDateSet].sort()

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1
      } else {
        const prev = new Date(sortedDates[i - 1])
        const curr = new Date(sortedDates[i])
        const diff = differenceInCalendarDays(curr, prev)

        if (diff === 1 || (diff === 3 && prev.getDay() === 5)) {
          tempStreak++
        } else {
          tempStreak = 1
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak)
    }

    // Calculate stats (using user's timezone)
    const zonedNow = toZonedTime(new Date(), timezone)
    const monthStart = format(startOfMonth(zonedNow), "yyyy-MM-dd")
    const monthEnd = format(endOfMonth(zonedNow), "yyyy-MM-dd")
    const weekStart = format(startOfWeek(zonedNow, { weekStartsOn: 1 }), "yyyy-MM-dd")

    const thisMonthDays = allOnsiteDays.filter((d) => d >= monthStart && d <= monthEnd).length
    const thisWeekDays = allOnsiteDays.filter((d) => d >= weekStart).length
    const totalMinutes = allWorkDays.reduce((sum, wd) => sum + (wd.totalMinutes || 0), 0)
    const totalHours = Math.round(totalMinutes / 60)

    // Perfect weeks count
    const weekMap = new Map<string, number>()
    for (const dateStr of allOnsiteDays) {
      const d = new Date(dateStr)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(d.getFullYear(), d.getMonth(), diff)
      const weekKey = format(monday, "yyyy-MM-dd")
      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1)
    }
    const perfectWeeks = [...weekMap.values()].filter((count) => count >= 3).length

    // Time-based stats (use recent data only for performance, with timezone conversion)
    let earlyBirdCount = 0
    let nightOwlCount = 0
    let onTimeCount = 0

    for (const wd of recentWorkDays) {
      if (wd.firstClockIn) {
        const zonedClockIn = toZonedTime(new Date(wd.firstClockIn), timezone)
        const hour = getHours(zonedClockIn)
        if (hour < 8) earlyBirdCount++
        if (hour >= 9 && hour <= 10) onTimeCount++
      }
      if (wd.lastClockOut) {
        const zonedClockOut = toZonedTime(new Date(wd.lastClockOut), timezone)
        const hour = getHours(zonedClockOut)
        if (hour >= 19) nightOwlCount++
      }
    }

    const breaksTaken = allWorkDays.filter((wd) => (wd.breakMinutes || 0) > 0).length
    const weekendDays = allWorkDays.filter((wd) => {
      const d = new Date(wd.date)
      return d.getDay() === 0 || d.getDay() === 6
    }).length
    const fullDays = allWorkDays.filter((wd) => (wd.totalMinutes || 0) >= 480).length
    const overtimeDays = allWorkDays.filter((wd) => (wd.totalMinutes || 0) >= 600).length

    const stats = {
      currentStreak,
      longestStreak,
      totalOnsiteDays: allOnsiteDays.length,
      totalHours,
      perfectWeeks,
      thisMonthDays,
      earlyBirdCount,
      nightOwlCount,
      onTimeCount,
      breaksTaken,
      weekendDays,
      fullDays,
      overtimeDays,
      totalDays: allWorkDays.length,
    }

    const badges = calculateBadges(stats)
    const xp = badges.filter((b) => b.earnedAt).reduce((sum, b) => sum + b.xp, 0)
    const currentLevel = LEVELS.findLast((l) => xp >= l.minXp) || LEVELS[0]
    const nextLevel = LEVELS.find((l) => l.minXp > xp) || LEVELS[LEVELS.length - 1]

    // Generate challenges (pass timezone for proper expiration dates)
    const challenges = generateChallenges(thisWeekDays, thisMonthDays, currentStreak, timezone)

    return NextResponse.json({
      currentStreak,
      longestStreak,
      totalOnsiteDays: allOnsiteDays.length,
      totalHours,
      thisMonthDays,
      perfectWeeks,
      badges,
      xp,
      level: currentLevel,
      nextLevel,
      xpProgress: xp - currentLevel.minXp,
      xpToNext: nextLevel.minXp - currentLevel.minXp,
      challenges,
      stats: {
        earlyBirdCount,
        nightOwlCount,
        onTimeCount,
        breaksTaken,
        weekendDays,
        fullDays,
        overtimeDays,
        avgClockIn: null,
      },
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
  earlyBirdCount: number
  nightOwlCount: number
  onTimeCount: number
  breaksTaken: number
  weekendDays: number
  fullDays: number
  overtimeDays: number
  totalDays: number
}

function calculateBadges(stats: Stats): Badge[] {
  const now = new Date().toISOString()

  return [
    // Streak badges
    {
      id: "first_day",
      name: "First Day",
      description: "Clocked in for the first time",
      icon: "🎯",
      category: "milestone",
      rarity: "common",
      xp: 10,
      earnedAt: stats.totalOnsiteDays >= 1 ? now : null,
      progress: stats.totalOnsiteDays,
      target: 1,
    },
    {
      id: "week_warrior",
      name: "Week Warrior",
      description: "5 consecutive on-site days",
      icon: "⚡",
      category: "streak",
      rarity: "uncommon",
      xp: 50,
      earnedAt: stats.longestStreak >= 5 ? now : null,
      progress: stats.longestStreak,
      target: 5,
    },
    {
      id: "two_week_streak",
      name: "Unstoppable",
      description: "10 consecutive on-site days",
      icon: "🔥",
      category: "streak",
      rarity: "rare",
      xp: 100,
      earnedAt: stats.longestStreak >= 10 ? now : null,
      progress: stats.longestStreak,
      target: 10,
    },
    {
      id: "three_week_streak",
      name: "On Fire",
      description: "15 consecutive on-site days",
      icon: "🌋",
      category: "streak",
      rarity: "epic",
      xp: 200,
      earnedAt: stats.longestStreak >= 15 ? now : null,
      progress: stats.longestStreak,
      target: 15,
    },
    {
      id: "month_streak",
      name: "Iron Will",
      description: "20 consecutive on-site days",
      icon: "💪",
      category: "streak",
      rarity: "legendary",
      xp: 500,
      earnedAt: stats.longestStreak >= 20 ? now : null,
      progress: stats.longestStreak,
      target: 20,
    },
    // Milestone badges
    {
      id: "month_master",
      name: "Month Master",
      description: "15+ on-site days in a month",
      icon: "🏆",
      category: "milestone",
      rarity: "rare",
      xp: 75,
      earnedAt: stats.thisMonthDays >= 15 ? now : null,
      progress: stats.thisMonthDays,
      target: 15,
    },
    {
      id: "perfect_week",
      name: "Perfect Week",
      description: "First week with 3+ on-site days",
      icon: "✅",
      category: "consistency",
      rarity: "common",
      xp: 25,
      earnedAt: stats.perfectWeeks >= 1 ? now : null,
      progress: stats.perfectWeeks,
      target: 1,
    },
    {
      id: "ten_perfect",
      name: "Consistency King",
      description: "10 perfect weeks",
      icon: "👑",
      category: "consistency",
      rarity: "rare",
      xp: 150,
      earnedAt: stats.perfectWeeks >= 10 ? now : null,
      progress: stats.perfectWeeks,
      target: 10,
    },
    {
      id: "twenty_perfect",
      name: "Routine Master",
      description: "20 perfect weeks",
      icon: "🎭",
      category: "consistency",
      rarity: "epic",
      xp: 300,
      earnedAt: stats.perfectWeeks >= 20 ? now : null,
      progress: stats.perfectWeeks,
      target: 20,
    },
    // Hour milestones
    {
      id: "hundred_hours",
      name: "Century Club",
      description: "100 total hours tracked",
      icon: "💯",
      category: "milestone",
      rarity: "uncommon",
      xp: 50,
      earnedAt: stats.totalHours >= 100 ? now : null,
      progress: stats.totalHours,
      target: 100,
    },
    {
      id: "five_hundred_hours",
      name: "Dedicated",
      description: "500 total hours tracked",
      icon: "🌟",
      category: "milestone",
      rarity: "rare",
      xp: 150,
      earnedAt: stats.totalHours >= 500 ? now : null,
      progress: stats.totalHours,
      target: 500,
    },
    {
      id: "thousand_hours",
      name: "Legend",
      description: "1,000 total hours tracked",
      icon: "🏅",
      category: "milestone",
      rarity: "epic",
      xp: 400,
      earnedAt: stats.totalHours >= 1000 ? now : null,
      progress: stats.totalHours,
      target: 1000,
    },
    {
      id: "two_thousand_hours",
      name: "Time Lord",
      description: "2,000 total hours tracked",
      icon: "⏳",
      category: "milestone",
      rarity: "legendary",
      xp: 750,
      earnedAt: stats.totalHours >= 2000 ? now : null,
      progress: stats.totalHours,
      target: 2000,
    },
    // Day milestones
    {
      id: "fifty_days",
      name: "Half Century",
      description: "50 total on-site days",
      icon: "🎖️",
      category: "milestone",
      rarity: "uncommon",
      xp: 75,
      earnedAt: stats.totalOnsiteDays >= 50 ? now : null,
      progress: stats.totalOnsiteDays,
      target: 50,
    },
    {
      id: "hundred_days",
      name: "Centurion",
      description: "100 total on-site days",
      icon: "🏛️",
      category: "milestone",
      rarity: "rare",
      xp: 200,
      earnedAt: stats.totalOnsiteDays >= 100 ? now : null,
      progress: stats.totalOnsiteDays,
      target: 100,
    },
    {
      id: "two_fifty_days",
      name: "Veteran",
      description: "250 total on-site days",
      icon: "💎",
      category: "milestone",
      rarity: "epic",
      xp: 500,
      earnedAt: stats.totalOnsiteDays >= 250 ? now : null,
      progress: stats.totalOnsiteDays,
      target: 250,
    },
    // Time-based badges
    {
      id: "early_bird",
      name: "Early Bird",
      description: "Clock in before 8am 10 times",
      icon: "🐦",
      category: "time",
      rarity: "uncommon",
      xp: 50,
      earnedAt: stats.earlyBirdCount >= 10 ? now : null,
      progress: stats.earlyBirdCount,
      target: 10,
    },
    {
      id: "early_riser",
      name: "Early Riser",
      description: "Clock in before 8am 50 times",
      icon: "🌅",
      category: "time",
      rarity: "rare",
      xp: 150,
      earnedAt: stats.earlyBirdCount >= 50 ? now : null,
      progress: stats.earlyBirdCount,
      target: 50,
    },
    {
      id: "night_owl",
      name: "Night Owl",
      description: "Clock out after 7pm 10 times",
      icon: "🦉",
      category: "time",
      rarity: "uncommon",
      xp: 50,
      earnedAt: stats.nightOwlCount >= 10 ? now : null,
      progress: stats.nightOwlCount,
      target: 10,
    },
    {
      id: "punctual",
      name: "Punctual",
      description: "Clock in between 9-10am 20 times",
      icon: "⏰",
      category: "time",
      rarity: "uncommon",
      xp: 40,
      earnedAt: stats.onTimeCount >= 20 ? now : null,
      progress: stats.onTimeCount,
      target: 20,
    },
    // Special badges
    {
      id: "break_champion",
      name: "Break Champion",
      description: "Take breaks on 20 work days",
      icon: "☕",
      category: "special",
      rarity: "uncommon",
      xp: 40,
      earnedAt: stats.breaksTaken >= 20 ? now : null,
      progress: stats.breaksTaken,
      target: 20,
    },
    {
      id: "weekend_warrior",
      name: "Weekend Warrior",
      description: "Work 5 weekend days",
      icon: "🗓️",
      category: "special",
      rarity: "rare",
      xp: 100,
      earnedAt: stats.weekendDays >= 5 ? now : null,
      progress: stats.weekendDays,
      target: 5,
    },
    {
      id: "full_timer",
      name: "Full Timer",
      description: "Work 8+ hour days 50 times",
      icon: "📊",
      category: "special",
      rarity: "rare",
      xp: 125,
      earnedAt: stats.fullDays >= 50 ? now : null,
      progress: stats.fullDays,
      target: 50,
    },
    {
      id: "overtime_hero",
      name: "Overtime Hero",
      description: "Work 10+ hour days 10 times",
      icon: "🦸",
      category: "special",
      rarity: "epic",
      xp: 200,
      earnedAt: stats.overtimeDays >= 10 ? now : null,
      progress: stats.overtimeDays,
      target: 10,
    },
  ]
}

function generateChallenges(thisWeekDays: number, thisMonthDays: number, currentStreak: number, timezone: string): Challenge[] {
  const zonedNow = toZonedTime(new Date(), timezone)
  const weekEnd = new Date(zonedNow)
  weekEnd.setDate(weekEnd.getDate() + (7 - getDay(zonedNow)))
  const monthEnd = endOfMonth(zonedNow)

  return [
    {
      id: "weekly_3days",
      name: "Weekly Goal",
      description: "Clock in 3 days this week",
      icon: "📅",
      type: "weekly",
      target: 3,
      progress: Math.min(thisWeekDays, 3),
      xpReward: 25,
      expiresAt: weekEnd.toISOString(),
      completed: thisWeekDays >= 3,
    },
    {
      id: "weekly_5days",
      name: "Perfect Week",
      description: "Clock in all 5 weekdays",
      icon: "⭐",
      type: "weekly",
      target: 5,
      progress: Math.min(thisWeekDays, 5),
      xpReward: 50,
      expiresAt: weekEnd.toISOString(),
      completed: thisWeekDays >= 5,
    },
    {
      id: "monthly_15days",
      name: "Monthly Regular",
      description: "Clock in 15 days this month",
      icon: "🗓️",
      type: "monthly",
      target: 15,
      progress: Math.min(thisMonthDays, 15),
      xpReward: 100,
      expiresAt: monthEnd.toISOString(),
      completed: thisMonthDays >= 15,
    },
    {
      id: "streak_5",
      name: "Streak Builder",
      description: "Build a 5-day streak",
      icon: "🔥",
      type: "weekly",
      target: 5,
      progress: Math.min(currentStreak, 5),
      xpReward: 75,
      expiresAt: weekEnd.toISOString(),
      completed: currentStreak >= 5,
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
    earlyBirdCount: 0,
    nightOwlCount: 0,
    onTimeCount: 0,
    breaksTaken: 0,
    weekendDays: 0,
    fullDays: 0,
    overtimeDays: 0,
    totalDays: 0,
  })
}
