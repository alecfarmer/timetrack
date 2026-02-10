import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { startOfWeek, endOfWeek, subWeeks, format, eachDayOfInterval } from "date-fns"

// POST /api/cron/weekly-digest - Generate weekly digest notifications
// Intended to be called by Vercel Cron or external scheduler
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: lastWeekStart, end: lastWeekEnd })

    // Get all active memberships with org info
    const { data: memberships } = await supabase
      .from("Membership")
      .select("userId, orgId, role, org:Organization (name)")
      .eq("isActive", true)

    if (!memberships?.length) {
      return NextResponse.json({ processed: 0 })
    }

    const digests: { userId: string; orgName: string; summary: Record<string, unknown> }[] = []

    for (const membership of memberships) {
      const orgName = Array.isArray(membership.org)
        ? membership.org[0]?.name
        : (membership.org as { name: string } | null)?.name || "Unknown"

      // Get workdays for the week
      const { data: workDays } = await supabase
        .from("WorkDay")
        .select("date, totalMinutes, meetsPolicy, breakMinutes")
        .eq("userId", membership.userId)
        .gte("date", format(lastWeekStart, "yyyy-MM-dd"))
        .lte("date", format(lastWeekEnd, "yyyy-MM-dd"))

      const totalMinutes = (workDays || []).reduce((s, wd) => s + (wd.totalMinutes || 0), 0)
      const daysWorked = (workDays || []).filter((wd) => wd.meetsPolicy).length
      const totalBreakMinutes = (workDays || []).reduce((s, wd) => s + (wd.breakMinutes || 0), 0)

      // Get policy
      const { data: policy } = await supabase
        .from("PolicyConfig")
        .select("requiredDaysPerWeek")
        .eq("orgId", membership.orgId)
        .eq("isActive", true)
        .order("effectiveDate", { ascending: false })
        .limit(1)
        .single()

      const requiredDays = policy?.requiredDaysPerWeek || 3
      const isCompliant = daysWorked >= requiredDays
      const totalHours = (totalMinutes / 60).toFixed(1)

      // Create alert notification for the user
      const { data: alertRules } = await supabase
        .from("AlertRule")
        .select("id")
        .eq("orgId", membership.orgId)
        .eq("isActive", true)
        .limit(1)

      // Store digest as an AlertNotification
      await supabase.from("AlertNotification").insert({
        orgId: membership.orgId,
        userId: membership.userId,
        ruleId: alertRules?.[0]?.id || null,
        type: "WEEKLY_DIGEST",
        title: `Weekly Summary — ${format(lastWeekStart, "MMM d")} to ${format(lastWeekEnd, "MMM d")}`,
        message: `You worked ${totalHours} hours across ${daysWorked} days. ${
          isCompliant
            ? "You met compliance requirements."
            : `You need ${requiredDays - daysWorked} more day(s) for compliance.`
        }`,
        severity: isCompliant ? "INFO" : "WARNING",
        metadata: {
          weekStart: format(lastWeekStart, "yyyy-MM-dd"),
          weekEnd: format(lastWeekEnd, "yyyy-MM-dd"),
          totalMinutes,
          daysWorked,
          requiredDays,
          isCompliant,
          totalBreakMinutes,
          dayCount: weekDays.length,
        },
      })

      digests.push({
        userId: membership.userId,
        orgName,
        summary: { totalHours, daysWorked, isCompliant },
      })
    }

    return NextResponse.json({ processed: digests.length, digests })
  } catch (error) {
    console.error("Weekly digest error:", error)
    return NextResponse.json({ error: "Failed to generate digests" }, { status: 500 })
  }
}
