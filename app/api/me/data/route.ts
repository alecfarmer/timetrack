import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// GET /api/me/data - Return all personal data for the authenticated user
export async function GET() {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    const userId = user!.id
    const now = new Date()
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()

    // Fetch all data sources in parallel
    const [
      entriesResult,
      workDaysResult,
      leaveResult,
      correctionsResult,
      membershipResult,
    ] = await Promise.all([
      // Entries from the last 90 days with location name
      supabase
        .from("Entry")
        .select("*, location:Location (id, name)")
        .eq("userId", userId)
        .gte("createdAt", ninetyDaysAgo)
        .order("createdAt", { ascending: false }),

      // WorkDays from the last 90 days
      supabase
        .from("WorkDay")
        .select("*")
        .eq("userId", userId)
        .gte("date", ninetyDaysAgo.slice(0, 10))
        .order("date", { ascending: false }),

      // All leave requests
      supabase
        .from("LeaveRequest")
        .select("*")
        .eq("userId", userId)
        .order("date", { ascending: false }),

      // Corrections made by this user
      supabase
        .from("EntryCorrection")
        .select("*")
        .eq("correctedBy", userId)
        .order("createdAt", { ascending: false }),

      // Membership info
      supabase
        .from("Membership")
        .select("*, org:Organization (id, name)")
        .eq("userId", userId)
        .limit(1)
        .single(),
    ])

    const entries = entriesResult.data || []
    const workDays = workDaysResult.data || []
    const leaveRequests = leaveResult.data || []
    const corrections = correctionsResult.data || []
    const membership = membershipResult.data

    // Group entries by date
    const entriesByDate: Record<string, typeof entries> = {}
    for (const entry of entries) {
      const date = entry.createdAt?.slice(0, 10) || "unknown"
      if (!entriesByDate[date]) {
        entriesByDate[date] = []
      }
      entriesByDate[date].push(entry)
    }

    // Calculate summary stats
    const totalMinutes = workDays.reduce((sum, wd) => sum + (wd.totalMinutes || 0), 0)
    const totalHoursLast90Days = Math.round((totalMinutes / 60) * 100) / 100
    const totalDaysLast90Days = workDays.length
    const avgHoursPerDay = totalDaysLast90Days > 0
      ? Math.round((totalHoursLast90Days / totalDaysLast90Days) * 100) / 100
      : 0

    const orgData = membership?.org
      ? (Array.isArray(membership.org) ? membership.org[0] : membership.org)
      : null

    const profile = {
      userId,
      email: user!.email,
      orgName: orgData?.name || null,
      role: membership?.role || null,
      memberSince: membership?.createdAt || null,
    }

    const summary = {
      totalHoursLast90Days,
      totalDaysLast90Days,
      avgHoursPerDay,
      correctionsCount: corrections.length,
    }

    return NextResponse.json({
      profile,
      summary,
      entries: entriesByDate,
      workDays,
      leaveRequests,
      corrections,
      dataCollected: [
        "GPS coordinates (latitude, longitude, accuracy) at clock in/out",
        "Client timestamps for all time entries",
        "Photo verification images (if enabled)",
        "Device online/offline status",
        "Browser timezone",
      ],
    })
  } catch (error) {
    console.error("Error fetching personal data:", error)
    return NextResponse.json({ error: "Failed to fetch personal data" }, { status: 500 })
  }
}
