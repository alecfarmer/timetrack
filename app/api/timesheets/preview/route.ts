import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const { user, org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 })
  }

  const { searchParams } = request.nextUrl
  const weekStart = searchParams.get("weekStart")
  const weekEnd = searchParams.get("weekEnd")

  if (!weekStart || !weekEnd) {
    return NextResponse.json(
      { error: "weekStart and weekEnd are required" },
      { status: 400 }
    )
  }

  // Fetch WorkDay records for the user in this date range
  const { data: workDays, error } = await supabase
    .from("WorkDay")
    .select("date, totalMinutes")
    .eq("userId", user.id)
    .gte("date", weekStart)
    .lte("date", weekEnd)
    .order("date", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Group by date
  const dayMap = new Map<string, { totalMinutes: number; entryCount: number }>()

  for (const wd of workDays ?? []) {
    const existing = dayMap.get(wd.date)
    if (existing) {
      existing.totalMinutes += wd.totalMinutes ?? 0
      existing.entryCount += 1
    } else {
      dayMap.set(wd.date, {
        totalMinutes: wd.totalMinutes ?? 0,
        entryCount: 1,
      })
    }
  }

  const days = Array.from(dayMap.entries()).map(([date, data]) => ({
    date,
    totalMinutes: data.totalMinutes,
    entryCount: data.entryCount,
  }))

  return NextResponse.json({ days })
}
