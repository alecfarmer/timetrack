import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { createEntrySchema, validateBody, getRequestTimezone } from "@/lib/validations"
import { processRewardsEvent } from "@/lib/rewards/events"

// Evaluate alert rules and fire notifications on clock events
async function evaluateAlertRules(
  userId: string,
  orgId: string,
  entryType: string,
  timezone: string
) {
  try {
    // Fetch active alert rules for the org
    const { data: rules } = await supabase
      .from("AlertRule")
      .select("*")
      .eq("orgId", orgId)
      .eq("isActive", true)

    if (!rules || rules.length === 0) return

    const now = new Date()
    const zonedNow = toZonedTime(now, timezone)
    const notifications: Array<{
      orgId: string
      ruleId: string
      targetUserId: string
      type: string
      title: string
      message: string
    }> = []

    for (const rule of rules) {
      const config = rule.config as Record<string, unknown>

      if (rule.type === "OVERTIME_APPROACHING" && entryType === "CLOCK_IN") {
        // Check weekly minutes approaching threshold
        const weekStart = startOfWeek(zonedNow, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(zonedNow, { weekStartsOn: 1 })
        const { data: workDays } = await supabase
          .from("WorkDay")
          .select("totalMinutes")
          .eq("userId", userId)
          .gte("date", weekStart.toISOString().split("T")[0])
          .lte("date", weekEnd.toISOString().split("T")[0])

        const weeklyMinutes = (workDays || []).reduce(
          (sum: number, d: { totalMinutes?: number }) => sum + (d.totalMinutes || 0),
          0
        )
        const threshold = (config.thresholdMinutes as number) || 2280
        if (weeklyMinutes >= threshold) {
          // Check if we already notified this week
          const { count } = await supabase
            .from("AlertNotification")
            .select("*", { count: "exact", head: true })
            .eq("targetUserId", userId)
            .eq("type", "OVERTIME_APPROACHING")
            .gte("createdAt", weekStart.toISOString())

          if (!count || count === 0) {
            const hours = Math.floor(weeklyMinutes / 60)
            notifications.push({
              orgId,
              ruleId: rule.id,
              targetUserId: userId,
              type: "OVERTIME_APPROACHING",
              title: "Overtime Approaching",
              message: `You've worked ${hours}h this week. ${config.description || ""}`,
            })
          }
        }
      }

      if (rule.type === "MISSED_CLOCK_OUT" && entryType === "CLOCK_IN") {
        // Check if there's a previous clock-in without clock-out exceeding threshold
        const thresholdHours = (config.thresholdHours as number) || 12
        const { data: lastClockIn } = await supabase
          .from("Entry")
          .select("timestampServer")
          .eq("userId", userId)
          .eq("type", "CLOCK_IN")
          .order("timestampServer", { ascending: false })
          .limit(2)

        if (lastClockIn && lastClockIn.length > 1) {
          const prevClockIn = new Date(lastClockIn[1].timestampServer)
          const hoursSince = (now.getTime() - prevClockIn.getTime()) / (1000 * 60 * 60)
          if (hoursSince >= thresholdHours) {
            // Check for a clock-out between prev clock-in and now
            const { count: clockOutCount } = await supabase
              .from("Entry")
              .select("*", { count: "exact", head: true })
              .eq("userId", userId)
              .eq("type", "CLOCK_OUT")
              .gte("timestampServer", prevClockIn.toISOString())
              .lt("timestampServer", lastClockIn[0].timestampServer)

            if (!clockOutCount || clockOutCount === 0) {
              notifications.push({
                orgId,
                ruleId: rule.id,
                targetUserId: userId,
                type: "MISSED_CLOCK_OUT",
                title: "Possible Missed Clock-Out",
                message: `Previous session may be missing a clock-out (${Math.round(hoursSince)}h ago). ${config.description || ""}`,
              })
            }
          }
        }
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      await supabase.from("AlertNotification").insert(notifications)
    }
  } catch (err) {
    // Alert evaluation is non-critical - log and continue
    console.error("Alert evaluation error:", err)
  }
}

// GET /api/entries - List entries with optional filters
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const searchParams = request.nextUrl.searchParams
    const locationId = searchParams.get("locationId")
    const date = searchParams.get("date")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("Entry")
      .select(`
        *,
        location:Location (id, name, code, category)
      `, { count: "exact" })
      .eq("userId", user!.id)
      .order("timestampServer", { ascending: false })
      .range(offset, offset + limit - 1)

    if (locationId) {
      query = query.eq("locationId", locationId)
    }

    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (date) {
      const targetDate = new Date(date)
      const zonedDate = toZonedTime(targetDate, getRequestTimezone(request))
      query = query
        .gte("timestampServer", startOfDay(zonedDate).toISOString())
        .lte("timestampServer", endOfDay(zonedDate).toISOString())
    } else if (startDate && endDate) {
      query = query
        .gte("timestampServer", new Date(startDate).toISOString())
        .lte("timestampServer", new Date(endDate).toISOString())
    }

    const { data: entries, count, error } = await query

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to fetch entries" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      entries,
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching entries:", error)
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    )
  }
}

// POST /api/entries - Create a new entry (clock in/out)
export async function POST(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    const body = await request.json()
    const validation = validateBody(createEntrySchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const {
      type,
      locationId,
      timestampClient,
      gpsLatitude,
      gpsLongitude,
      gpsAccuracy,
      notes,
      photoUrl,
    } = validation.data

    // Verify location exists and belongs to user's org
    const { data: location, error: locError } = await supabase
      .from("Location")
      .select("id, orgId")
      .eq("id", locationId)
      .single()

    if (locError || !location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      )
    }

    if (org && location.orgId !== org.orgId) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      )
    }

    // Create the entry
    const now = new Date()
    const { data: entry, error: entryError } = await supabase
      .from("Entry")
      .insert({
        type,
        locationId,
        userId: user!.id,
        timestampClient: timestampClient ? new Date(timestampClient).toISOString() : now.toISOString(),
        timestampServer: now.toISOString(),
        gpsLatitude,
        gpsLongitude,
        gpsAccuracy,
        notes,
        photoUrl: photoUrl || null,
      })
      .select(`
        *,
        location:Location (id, name, code, category)
      `)
      .single()

    if (entryError) {
      console.error("Supabase error:", entryError)
      return NextResponse.json(
        { error: "Failed to create entry" },
        { status: 500 }
      )
    }

    // Evaluate alert rules (non-blocking)
    if (org) {
      evaluateAlertRules(user!.id, org.orgId, type, getRequestTimezone(request))
    }

    // Update or create WorkDay
    const serverDate = new Date(entry.timestampServer)
    const zonedDate = toZonedTime(serverDate, getRequestTimezone(request))
    const workDayDate = startOfDay(zonedDate)

    const { data: existingWorkDay } = await supabase
      .from("WorkDay")
      .select("*")
      .eq("date", workDayDate.toISOString().split("T")[0])
      .eq("locationId", locationId)
      .eq("userId", user!.id)
      .single()

    if (existingWorkDay) {
      // Link this entry to the WorkDay first
      await supabase
        .from("Entry")
        .update({ workDayId: existingWorkDay.id })
        .eq("id", entry.id)

      const updateData: Record<string, unknown> = {}

      if (type === "CLOCK_IN") {
        if (!existingWorkDay.firstClockIn || serverDate < new Date(existingWorkDay.firstClockIn)) {
          updateData.firstClockIn = serverDate.toISOString()
        }
      } else if (type === "CLOCK_OUT") {
        if (!existingWorkDay.lastClockOut || serverDate > new Date(existingWorkDay.lastClockOut)) {
          updateData.lastClockOut = serverDate.toISOString()
        }
      }

      // Recalculate totalMinutes from all entries linked to this WorkDay
      // This correctly handles multiple sessions and break deductions
      const { data: dayEntries } = await supabase
        .from("Entry")
        .select("type, timestampServer")
        .eq("workDayId", existingWorkDay.id)
        .order("timestampServer", { ascending: true })

      if (dayEntries && dayEntries.length > 0) {
        let workMs = 0
        let breakMs = 0
        let lastClockIn: Date | null = null
        let lastBreakStart: Date | null = null

        for (const e of dayEntries) {
          const ts = new Date(e.timestampServer)
          switch (e.type) {
            case "CLOCK_IN":
              lastClockIn = ts
              break
            case "CLOCK_OUT":
              if (lastClockIn) {
                workMs += ts.getTime() - lastClockIn.getTime()
                lastClockIn = null
              }
              break
            case "BREAK_START":
              lastBreakStart = ts
              break
            case "BREAK_END":
              if (lastBreakStart) {
                breakMs += ts.getTime() - lastBreakStart.getTime()
                lastBreakStart = null
              }
              break
          }
        }

        const totalMinutes = Math.max(0, Math.floor((workMs - breakMs) / 60000))
        updateData.totalMinutes = totalMinutes
        updateData.breakMinutes = Math.floor(breakMs / 60000)
        updateData.meetsPolicy = totalMinutes >= 480 // 8 hours required for on-site day to count
      }

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from("WorkDay")
          .update(updateData)
          .eq("id", existingWorkDay.id)
      }
    } else {
      const { data: workDay } = await supabase
        .from("WorkDay")
        .insert({
          date: workDayDate.toISOString().split("T")[0],
          locationId,
          userId: user!.id,
          firstClockIn: type === "CLOCK_IN" ? serverDate.toISOString() : null,
          lastClockOut: type === "CLOCK_OUT" ? serverDate.toISOString() : null,
          meetsPolicy: false,
        })
        .select()
        .single()

      if (workDay) {
        await supabase
          .from("Entry")
          .update({ workDayId: workDay.id })
          .eq("id", entry.id)
      }
    }

    // Process rewards events (non-blocking)
    let rewardsEvents = null
    if (org) {
      try {
        rewardsEvents = await processRewardsEvent(
          user!.id, org.orgId, type, entry, getRequestTimezone(request)
        )
      } catch (err) {
        // Rewards processing is non-critical
        console.error("Rewards processing error:", err)
      }
    }

    return NextResponse.json({ ...entry, rewardsEvents }, { status: 201 })
  } catch (error) {
    console.error("Error creating entry:", error)
    return NextResponse.json(
      { error: "Failed to create entry" },
      { status: 500 }
    )
  }
}
