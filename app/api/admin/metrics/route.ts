import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { getRequestTimezone } from "@/lib/validations"

interface AdminMetrics {
  totalMembers: number
  currentlyOnSite: number
  todayClockIns: number
  pendingTimesheets: number
  complianceRate: number
  weeklyCompliant: number
  weeklyTotal: number
}

// GET /api/admin/metrics - Get admin dashboard metrics
export async function GET(request: NextRequest) {
  try {
    const { org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org || org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const timezone = getRequestTimezone(request)
    const now = new Date()
    const zonedNow = toZonedTime(now, timezone)
    const todayStart = startOfDay(zonedNow)
    const todayEnd = endOfDay(zonedNow)
    const weekStart = startOfWeek(zonedNow, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(zonedNow, { weekStartsOn: 1 })

    // Get all org members
    const { data: members } = await supabase
      .from("Membership")
      .select("userId")
      .eq("orgId", org.orgId)

    const totalMembers = members?.length || 0
    const memberIds = members?.map((m) => m.userId) || []

    if (memberIds.length === 0) {
      return NextResponse.json({
        totalMembers: 0,
        currentlyOnSite: 0,
        todayClockIns: 0,
        pendingTimesheets: 0,
        complianceRate: 100,
        weeklyCompliant: 0,
        weeklyTotal: 0,
      } as AdminMetrics)
    }

    // Get today's entries to calculate currently on-site and today's clock-ins
    const { data: todayEntries } = await supabase
      .from("Entry")
      .select("id, userId, type, timestampServer")
      .in("userId", memberIds)
      .gte("timestampServer", todayStart.toISOString())
      .lte("timestampServer", todayEnd.toISOString())
      .order("timestampServer", { ascending: false })

    // Calculate currently on-site (users whose last entry is CLOCK_IN)
    const userLatestEntry = new Map<string, string>()
    for (const entry of todayEntries || []) {
      if (!userLatestEntry.has(entry.userId)) {
        userLatestEntry.set(entry.userId, entry.type)
      }
    }
    const currentlyOnSite = Array.from(userLatestEntry.values()).filter(
      (type) => type === "CLOCK_IN"
    ).length

    // Count today's clock-ins (unique users who clocked in today)
    const usersWhoClocked = new Set(
      (todayEntries || [])
        .filter((e) => e.type === "CLOCK_IN")
        .map((e) => e.userId)
    )
    const todayClockIns = usersWhoClocked.size

    // Get pending timesheet submissions
    const { count: pendingTimesheets } = await supabase
      .from("TimesheetSubmission")
      .select("id", { count: "exact", head: true })
      .eq("orgId", org.orgId)
      .eq("status", "PENDING")

    // Get weekly compliance data from WorkDay
    const { data: workDays } = await supabase
      .from("WorkDay")
      .select("userId, totalMinutes")
      .in("userId", memberIds)
      .gte("date", weekStart.toISOString().split("T")[0])
      .lte("date", weekEnd.toISOString().split("T")[0])

    // Count days worked per user this week
    const userDaysWorked = new Map<string, number>()
    for (const wd of workDays || []) {
      if (wd.totalMinutes > 0) {
        userDaysWorked.set(wd.userId, (userDaysWorked.get(wd.userId) || 0) + 1)
      }
    }

    // Get required days from policy
    const { data: policyData } = await supabase
      .from("PolicyConfig")
      .select("requiredDaysPerWeek")
      .eq("orgId", org.orgId)
      .is("jurisdictionCode", null)
      .single()

    const requiredDays = policyData?.requiredDaysPerWeek || 3

    // Calculate compliance
    let weeklyCompliant = 0
    for (const [, days] of userDaysWorked) {
      if (days >= requiredDays) {
        weeklyCompliant++
      }
    }
    const weeklyTotal = totalMembers
    const complianceRate = weeklyTotal > 0 ? Math.round((weeklyCompliant / weeklyTotal) * 100) : 100

    const metrics: AdminMetrics = {
      totalMembers,
      currentlyOnSite,
      todayClockIns,
      pendingTimesheets: pendingTimesheets || 0,
      complianceRate,
      weeklyCompliant,
      weeklyTotal,
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Error fetching admin metrics:", error)
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}
