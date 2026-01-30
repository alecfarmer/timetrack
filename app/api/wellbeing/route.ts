import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

type Period = "1week" | "2weeks" | "4weeks"

function getPeriodDays(period: Period): number {
  switch (period) {
    case "1week":
      return 7
    case "2weeks":
      return 14
    case "4weeks":
      return 28
    default:
      return 14
  }
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

interface WorkDayRecord {
  id: string
  userId: string
  date: string
  totalMinutes: number | null
  breakMinutes: number | null
}

interface MemberSignals {
  userId: string
  email: string
  consecutiveWorkDays: number
  overtimeMinutes: number
  breakSkipCount: number
  avgDailyMinutes: number
  burnoutScore: number
}

// GET /api/wellbeing - Fetch well-being signals for org members (admin only)
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 403 }
      )
    }

    if (org.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: admin access required" },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const period = (searchParams.get("period") || "2weeks") as Period

    if (!["1week", "2weeks", "4weeks"].includes(period)) {
      return NextResponse.json(
        { error: "Invalid period. Must be one of: 1week, 2weeks, 4weeks" },
        { status: 400 }
      )
    }

    const periodDays = getPeriodDays(period)

    // Fetch all memberships for this org
    const { data: members, error: membersError } = await supabase
      .from("Membership")
      .select("userId")
      .eq("orgId", org.orgId)

    if (membersError) {
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      )
    }

    const memberIds = members.map((m: { userId: string }) => m.userId)

    if (memberIds.length === 0) {
      return NextResponse.json({ members: [] })
    }

    // Fetch existing WellBeingSnapshot records for the org
    const { data: snapshots } = await supabase
      .from("WellBeingSnapshot")
      .select("*")
      .eq("orgId", org.orgId)

    // Compute the date range: last 14 days for consecutive-day lookback,
    // but we use the period param to scope the overall window
    const today = new Date()
    const lookbackStart = new Date()
    lookbackStart.setDate(today.getDate() - periodDays)

    const startStr = formatDate(lookbackStart)
    const endStr = formatDate(today)

    // Batch fetch: get ALL WorkDay records for all member userIds in one query
    const { data: workDays, error: workDaysError } = await supabase
      .from("WorkDay")
      .select("id, userId, date, totalMinutes, breakMinutes")
      .in("userId", memberIds)
      .gte("date", startStr)
      .lte("date", endStr)
      .order("date", { ascending: true })

    if (workDaysError) {
      return NextResponse.json(
        { error: "Failed to fetch work days" },
        { status: 500 }
      )
    }

    const workDayRecords: WorkDayRecord[] = workDays || []

    // Partition work days by userId in JS
    const workDaysByUser = new Map<string, WorkDayRecord[]>()
    for (const memberId of memberIds) {
      workDaysByUser.set(memberId, [])
    }
    for (const wd of workDayRecords) {
      const list = workDaysByUser.get(wd.userId)
      if (list) {
        list.push(wd)
      }
    }

    // Fetch user emails via admin API
    const { data: authUsers } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    })

    const emailMap = new Map<string, string>()
    if (authUsers?.users) {
      for (const u of authUsers.users) {
        emailMap.set(u.id, u.email || "")
      }
    }

    // Date helpers for 7-day window
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(today.getDate() - 7)
    const sevenDaysAgoStr = formatDate(sevenDaysAgo)

    const todayStr = formatDate(today)

    // Compute signals per member
    const memberSignals: MemberSignals[] = memberIds.map((userId: string) => {
      const userWorkDays = workDaysByUser.get(userId) || []

      // --- consecutiveWorkDays: count consecutive days ending today ---
      const workDayDates = new Set(userWorkDays.map((wd) => wd.date))
      let consecutiveWorkDays = 0
      const checkDate = new Date(today)
      while (true) {
        const dateStr = formatDate(checkDate)
        if (workDayDates.has(dateStr)) {
          consecutiveWorkDays++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }

      // --- Filter to last 7 days for overtime, break skip, avg ---
      const last7Days = userWorkDays.filter((wd) => wd.date >= sevenDaysAgoStr && wd.date <= todayStr)

      // overtimeMinutes: sum of (totalMinutes - 480) where totalMinutes > 480
      let overtimeMinutes = 0
      for (const wd of last7Days) {
        const total = wd.totalMinutes || 0
        if (total > 480) {
          overtimeMinutes += total - 480
        }
      }

      // breakSkipCount: work days where breakMinutes = 0 and totalMinutes >= 360
      let breakSkipCount = 0
      for (const wd of last7Days) {
        const total = wd.totalMinutes || 0
        const breakMin = wd.breakMinutes || 0
        if (breakMin === 0 && total >= 360) {
          breakSkipCount++
        }
      }

      // avgDailyMinutes: average of totalMinutes over last 7 days
      let avgDailyMinutes = 0
      if (last7Days.length > 0) {
        const totalMin = last7Days.reduce((sum, wd) => sum + (wd.totalMinutes || 0), 0)
        avgDailyMinutes = Math.round(totalMin / last7Days.length)
      }

      // burnoutScore: 0-100 scale
      let burnoutScore = 0
      if (consecutiveWorkDays >= 6) burnoutScore += 25
      if (overtimeMinutes > 120) burnoutScore += 25
      if (breakSkipCount >= 3) burnoutScore += 25
      if (avgDailyMinutes > 540) burnoutScore += 25

      return {
        userId,
        email: emailMap.get(userId) || "",
        consecutiveWorkDays,
        overtimeMinutes,
        breakSkipCount,
        avgDailyMinutes,
        burnoutScore,
      }
    })

    return NextResponse.json({
      members: memberSignals,
      snapshots: snapshots || [],
      period,
    })
  } catch (error) {
    console.error("Wellbeing error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
