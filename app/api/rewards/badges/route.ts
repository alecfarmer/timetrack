import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { getRequestTimezone } from "@/lib/validations"
import { getBadgeProgress } from "@/lib/rewards/badges"
import { format, startOfMonth, endOfMonth, getHours } from "date-fns"
import { toZonedTime } from "date-fns-tz"

// GET /api/rewards/badges — All badge definitions with earned status and progress
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 403 })

    const userId = user!.id
    const orgId = org.orgId
    const timezone = getRequestTimezone(request)

    // Gather stats for progress calculation
    const stats = await gatherStats(userId, orgId, timezone)
    const badgesWithProgress = await getBadgeProgress(userId, orgId, stats)

    // Get badge sets info
    const sets = new Map<string, { badges: string[]; earned: string[]; total: number }>()
    for (const bp of badgesWithProgress) {
      if (bp.badge.setId) {
        const set = sets.get(bp.badge.setId) || { badges: [], earned: [], total: 0 }
        set.badges.push(bp.badge.slug)
        set.total++
        if (bp.earned) set.earned.push(bp.badge.slug)
        sets.set(bp.badge.setId, set)
      }
    }

    const setsData = Object.fromEntries(
      [...sets.entries()].map(([id, data]) => [
        id,
        { ...data, complete: data.earned.length === data.total },
      ])
    )

    return NextResponse.json({
      badges: badgesWithProgress,
      sets: setsData,
      totalEarned: badgesWithProgress.filter((b) => b.earned).length,
      totalBadges: badgesWithProgress.filter((b) => !b.badge.isHidden || b.earned).length,
    })
  } catch (error) {
    console.error("Badges error:", error)
    return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 })
  }
}

async function gatherStats(userId: string, orgId: string, timezone: string) {
  const now = new Date()
  const zonedNow = toZonedTime(now, timezone)

  const [workDaysResult, kudosGiven, kudosReceived, challengesCompleted, shieldsResult, hiddenResult, streakHistoryResult] = await Promise.all([
    supabase
      .from("WorkDay")
      .select("date, totalMinutes, firstClockIn, lastClockOut, breakMinutes, location:Location(category)")
      .eq("userId", userId)
      .order("date", { ascending: false }),
    supabase.from("Kudos").select("id", { count: "exact", head: true }).eq("fromUserId", userId).eq("orgId", orgId),
    supabase.from("Kudos").select("id", { count: "exact", head: true }).eq("toUserId", userId).eq("orgId", orgId),
    supabase.from("ActiveChallenge").select("id", { count: "exact", head: true }).eq("userId", userId).eq("orgId", orgId).eq("status", "claimed"),
    supabase.from("StreakHistory").select("shieldsUsed").eq("userId", userId).eq("orgId", orgId),
    supabase.from("EarnedBadge").select("badgeDefinitionId").eq("userId", userId).eq("orgId", orgId),
    supabase.from("StreakHistory").select("length, endDate").eq("userId", userId).eq("orgId", orgId),
  ])

  const allWorkDays = workDaysResult.data || []
  const filterOnsite = (days: typeof allWorkDays) =>
    days.filter((wd) => {
      const loc = Array.isArray(wd.location) ? wd.location[0] : wd.location
      return loc?.category !== "HOME"
    })

  const onsiteDays = filterOnsite(allWorkDays)
  const monthStart = format(startOfMonth(zonedNow), "yyyy-MM-dd")
  const monthEnd = format(endOfMonth(zonedNow), "yyyy-MM-dd")

  const weekMap = new Map<string, number>()
  for (const wd of onsiteDays) {
    const d = new Date(wd.date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.getFullYear(), d.getMonth(), diff)
    const weekKey = format(monday, "yyyy-MM-dd")
    weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1)
  }

  const { data: profile } = await supabase
    .from("RewardsProfile")
    .select("currentStreak, longestStreak, xpMultiplier, streakShields")
    .eq("userId", userId)
    .eq("orgId", orgId)
    .single()

  const totalShieldsUsed = (shieldsResult.data || []).reduce((sum, s) => sum + (s.shieldsUsed || 0), 0)

  let hiddenBadgesFound = 0
  if (hiddenResult.data && hiddenResult.data.length > 0) {
    const badgeIds = hiddenResult.data.map((eb) => eb.badgeDefinitionId)
    const { count } = await supabase.from("BadgeDefinition").select("id", { count: "exact", head: true }).in("id", badgeIds).eq("isHidden", true)
    hiddenBadgesFound = count || 0
  }

  const allStreakHistories = streakHistoryResult.data || []
  const completedStreakLengths = allStreakHistories
    .filter((s) => s.endDate !== null)
    .map((s) => s.length || 0)
  const totalStreakDays = allStreakHistories.reduce((sum, s) => sum + (s.length || 0), 0)

  return {
    totalOnsiteDays: onsiteDays.length,
    totalHours: Math.round(allWorkDays.reduce((sum, wd) => sum + (wd.totalMinutes || 0), 0) / 60),
    currentStreak: profile?.currentStreak || 0,
    longestStreak: profile?.longestStreak || 0,
    perfectWeeks: [...weekMap.values()].filter((count) => count >= 3).length,
    thisMonthDays: onsiteDays.filter((d) => d.date >= monthStart && d.date <= monthEnd).length,
    earlyBirdCount: allWorkDays.filter((wd) => wd.firstClockIn && getHours(new Date(wd.firstClockIn)) < 8).length,
    dawnPatrolCount: allWorkDays.filter((wd) => wd.firstClockIn && getHours(new Date(wd.firstClockIn)) < 7).length,
    nightOwlCount: allWorkDays.filter((wd) => wd.lastClockOut && getHours(new Date(wd.lastClockOut)) >= 19).length,
    onTimeCount: allWorkDays.filter((wd) => {
      if (!wd.firstClockIn) return false
      const h = getHours(new Date(wd.firstClockIn))
      return h >= 9 && h <= 10
    }).length,
    breaksTaken: allWorkDays.filter((wd) => (wd.breakMinutes || 0) > 0).length,
    weekendDays: allWorkDays.filter((wd) => {
      const d = new Date(wd.date)
      return d.getDay() === 0 || d.getDay() === 6
    }).length,
    fullDays: allWorkDays.filter((wd) => (wd.totalMinutes || 0) >= 480).length,
    overtimeDays: allWorkDays.filter((wd) => (wd.totalMinutes || 0) >= 600).length,
    kudosGiven: kudosGiven.count || 0,
    kudosReceived: kudosReceived.count || 0,
    challengesCompleted: challengesCompleted.count || 0,
    hiddenBadgesFound,
    shieldsUsed: totalShieldsUsed,
    xpMultiplier: Number(profile?.xpMultiplier || 1.0),
    streakShields: profile?.streakShields || 0,
    totalStreakDays,
    streakLengths: completedStreakLengths,
  }
}
