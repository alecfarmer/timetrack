import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { format, eachDayOfInterval, parseISO, isWeekend, addDays } from "date-fns"
import { createLeaveSchema, validateBody } from "@/lib/validations"
import { calculatePtoBalance } from "@/lib/leave-balance"

// Helper to get available comp time balance
async function getCompTimeBalance(userId: string) {
  const { data: entries } = await supabase
    .from("CompTimeEntry")
    .select("id, minutesEarned, minutesUsed")
    .eq("userId", userId)
    .in("status", ["AVAILABLE", "PARTIALLY_USED"])
    .gt("expiresAt", new Date().toISOString())
    .order("expiresAt", { ascending: true }) // Use oldest first

  if (!entries) return { availableMinutes: 0, entries: [] }

  const availableMinutes = entries.reduce(
    (sum, e) => sum + (e.minutesEarned - e.minutesUsed),
    0
  )

  return { availableMinutes, entries }
}

// Helper to deduct comp time (FIFO - oldest expiring first)
async function deductCompTime(userId: string, minutesToDeduct: number, leaveRequestIds: string[]) {
  const { entries } = await getCompTimeBalance(userId)

  let remaining = minutesToDeduct

  for (const entry of entries) {
    if (remaining <= 0) break

    const available = entry.minutesEarned - entry.minutesUsed
    const toDeduct = Math.min(available, remaining)

    // Update the comp time entry
    const newUsed = entry.minutesUsed + toDeduct
    const newStatus = newUsed >= entry.minutesEarned ? "FULLY_USED" : "PARTIALLY_USED"

    await supabase
      .from("CompTimeEntry")
      .update({ minutesUsed: newUsed, status: newStatus })
      .eq("id", entry.id)

    // Record usage for each leave request
    for (const leaveId of leaveRequestIds) {
      // Check if usage already exists
      const { data: existing } = await supabase
        .from("CompTimeUsage")
        .select("id")
        .eq("compTimeEntryId", entry.id)
        .eq("leaveRequestId", leaveId)
        .single()

      if (!existing) {
        await supabase
          .from("CompTimeUsage")
          .insert({
            compTimeEntryId: entry.id,
            leaveRequestId: leaveId,
            minutesUsed: Math.floor(toDeduct / leaveRequestIds.length),
          })
      }
    }

    remaining -= toDeduct
  }

  return minutesToDeduct - remaining // Actual amount deducted
}

// GET /api/leave?month=2025-01 - Get leave requests for a month
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get("month") // YYYY-MM
    const year = searchParams.get("year") // YYYY

    let query = supabase
      .from("LeaveRequest")
      .select("*")
      .eq("userId", user!.id)
      .order("date", { ascending: true })

    if (month) {
      const [y, m] = month.split("-").map(Number)
      const start = new Date(y, m - 1, 1)
      const end = new Date(y, m, 0)
      query = query
        .gte("date", format(start, "yyyy-MM-dd"))
        .lte("date", format(end, "yyyy-MM-dd"))
    } else if (year) {
      query = query
        .gte("date", `${year}-01-01`)
        .lte("date", `${year}-12-31`)
    }

    const { data: leaves, error } = await query

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch leave requests", details: error.message },
        { status: 500 }
      )
    }

    // Calculate summary — each record represents one day
    // (multi-day ranges are expanded into individual records on creation)
    const summary = (leaves || []).reduce(
      (acc, leave) => {
        const type = leave.type as string
        if (!acc.byType[type]) acc.byType[type] = 0
        acc.byType[type] += 1
        acc.totalDays += 1
        return acc
      },
      { totalDays: 0, byType: {} as Record<string, number> }
    )

    // Include PTO balance when yearly summary is requested
    let balance = null
    if (year) {
      const { user: authUser, org } = await getAuthUser()
      if (authUser && org) {
        try {
          balance = await calculatePtoBalance(authUser.id, org.orgId)
        } catch {
          // Non-fatal: balance is supplementary info
        }
      }
    }

    return NextResponse.json({ leaves: leaves || [], summary, balance })
  } catch (error) {
    console.error("Error fetching leave:", error)
    return NextResponse.json({ error: "Failed to fetch leave requests" }, { status: 500 })
  }
}

// POST /api/leave - Create a leave request
export async function POST(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    const body = await request.json()
    const validation = validateBody(createLeaveSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { type, date, endDate, notes } = validation.data

    // For date ranges, create individual records for each day
    const startDate = parseISO(date)
    const end = endDate ? parseISO(endDate) : startDate
    const days = eachDayOfInterval({ start: startDate, end })

    // Check PTO balance before creating records
    if (type === "PTO" && org) {
      try {
        const balance = await calculatePtoBalance(user!.id, org.orgId)
        if (balance.annualAllowance > 0 && days.length > balance.remaining) {
          return NextResponse.json(
            {
              error: `Insufficient PTO balance. You have ${balance.remaining} day(s) remaining but requested ${days.length}.`,
            },
            { status: 400 }
          )
        }
      } catch {
        // Non-fatal: if balance check fails, allow the request
      }
    }

    // Check comp time balance for COMP leave type
    if (type === "COMP") {
      const minutesNeeded = days.length * 480 // 8 hours per day
      const { availableMinutes } = await getCompTimeBalance(user!.id)

      if (availableMinutes < minutesNeeded) {
        const availableHours = Math.floor(availableMinutes / 60)
        const neededHours = Math.floor(minutesNeeded / 60)
        return NextResponse.json(
          {
            error: `Insufficient comp time balance. You have ${availableHours}h available but need ${neededHours}h.`,
          },
          { status: 400 }
        )
      }
    }

    const records = days.map((d) => ({
      userId: user!.id,
      orgId: org?.orgId || null,
      type,
      date: format(d, "yyyy-MM-dd"),
      endDate: endDate || null,
      notes: notes || null,
      status: "APPROVED",
    }))

    const { data, error } = await supabase
      .from("LeaveRequest")
      .upsert(records, { onConflict: "userId,date" })
      .select()

    if (error) {
      return NextResponse.json(
        { error: "Failed to create leave request", details: error.message },
        { status: 500 }
      )
    }

    // Handle COMP leave - deduct from comp time balance
    if (type === "COMP" && data && data.length > 0) {
      const minutesToDeduct = data.length * 480 // 8 hours per day
      const leaveIds = data.map(l => l.id)
      await deductCompTime(user!.id, minutesToDeduct, leaveIds)
    }

    // Handle TRAVEL leave - auto-grant comp time for weekend days
    if (type === "TRAVEL" && data && data.length > 0 && org) {
      const weekendDays = days.filter(d => isWeekend(d))

      if (weekendDays.length > 0) {
        // Create comp time entries for weekend travel days
        for (const d of weekendDays) {
          const sourceId = data.find(l => l.date === format(d, "yyyy-MM-dd"))?.id

          // Check if comp entry already exists for this source
          if (sourceId) {
            const { data: existing } = await supabase
              .from("CompTimeEntry")
              .select("id")
              .eq("type", "TRAVEL")
              .eq("sourceId", sourceId)
              .single()

            if (!existing) {
              const expiresAt = addDays(new Date(), 90)
              await supabase
                .from("CompTimeEntry")
                .insert({
                  userId: user!.id,
                  orgId: org.orgId,
                  type: "TRAVEL",
                  sourceId,
                  sourceDate: format(d, "yyyy-MM-dd"),
                  minutesEarned: 480, // Full day = 8 hours
                  description: `Weekend travel: ${format(d, "EEE, MMM d")}${notes ? ` - ${notes}` : ""}`,
                  expiresAt: expiresAt.toISOString(),
                })
            }
          }
        }
      }
    }

    return NextResponse.json({
      leaves: data,
      compTimeGranted: type === "TRAVEL" ? days.filter(d => isWeekend(d)).length : 0,
    })
  } catch (error) {
    console.error("Error creating leave:", error)
    return NextResponse.json({ error: "Failed to create leave request" }, { status: 500 })
  }
}

// DELETE /api/leave?date=2025-01-15 - Delete a leave request
export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const date = request.nextUrl.searchParams.get("date")
    const id = request.nextUrl.searchParams.get("id")

    if (!date && !id) {
      return NextResponse.json({ error: "Date or ID required" }, { status: 400 })
    }

    let query = supabase.from("LeaveRequest").delete().eq("userId", user!.id)

    if (id) {
      query = query.eq("id", id)
    } else if (date) {
      query = query.eq("date", date)
    }

    const { error } = await query

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete leave request", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting leave:", error)
    return NextResponse.json({ error: "Failed to delete leave request" }, { status: 500 })
  }
}
