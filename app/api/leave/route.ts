import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { format, eachDayOfInterval, parseISO } from "date-fns"
import { createLeaveSchema, validateBody } from "@/lib/validations"

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

    return NextResponse.json({ leaves: leaves || [], summary })
  } catch (error) {
    console.error("Error fetching leave:", error)
    return NextResponse.json({ error: "Failed to fetch leave requests" }, { status: 500 })
  }
}

// POST /api/leave - Create a leave request
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser()
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

    const records = days.map((d) => ({
      userId: user!.id,
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

    return NextResponse.json({ leaves: data })
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
