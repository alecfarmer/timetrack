import { supabaseAdmin as supabase } from "@/lib/supabase"
import { addDays } from "date-fns"
import { fromZonedTime } from "date-fns-tz"

/**
 * Recalculate WorkDay totals from all entries for a given user/date/location.
 * Queries entries by date range (not workDayId) to ensure manual and natural
 * entries are all included. Creates the WorkDay if it doesn't exist, deletes
 * it if no entries remain, and links all matching entries.
 */
export async function recalculateWorkDay(
  userId: string,
  dateStr: string, // YYYY-MM-DD (in user's timezone)
  locationId: string,
  timezone: string
) {
  // Find existing WorkDay
  const { data: workDay } = await supabase
    .from("WorkDay")
    .select("*")
    .eq("date", dateStr)
    .eq("locationId", locationId)
    .eq("userId", userId)
    .single()

  // Convert timezone-local date boundaries to UTC for querying entries
  const localDayStart = new Date(`${dateStr}T00:00:00`)
  const utcStart = fromZonedTime(localDayStart, timezone)
  const utcEnd = fromZonedTime(addDays(localDayStart, 1), timezone)

  // Get all entries for this user/location on this date (in their timezone)
  const { data: dayEntries } = await supabase
    .from("Entry")
    .select("id, type, timestampServer")
    .eq("userId", userId)
    .eq("locationId", locationId)
    .gte("timestampServer", utcStart.toISOString())
    .lt("timestampServer", utcEnd.toISOString())
    .order("timestampServer", { ascending: true })

  if (!dayEntries || dayEntries.length === 0) {
    // No entries left — delete WorkDay if it exists
    if (workDay) {
      await supabase.from("WorkDay").delete().eq("id", workDay.id)
    }
    return
  }

  // Calculate totals from paired entries
  let workMs = 0
  let breakMs = 0
  let lastClockIn: Date | null = null
  let lastBreakStart: Date | null = null
  let firstClockIn: Date | null = null
  let lastClockOut: Date | null = null

  for (const e of dayEntries) {
    const ts = new Date(e.timestampServer)
    switch (e.type) {
      case "CLOCK_IN":
        lastClockIn = ts
        if (!firstClockIn || ts < firstClockIn) firstClockIn = ts
        break
      case "CLOCK_OUT":
        if (lastClockIn) {
          workMs += ts.getTime() - lastClockIn.getTime()
          lastClockIn = null
        }
        if (!lastClockOut || ts > lastClockOut) lastClockOut = ts
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
  const breakMinutes = Math.floor(breakMs / 60000)
  const meetsPolicy = totalMinutes >= 480

  if (workDay) {
    // Update existing WorkDay
    await supabase
      .from("WorkDay")
      .update({
        totalMinutes,
        breakMinutes,
        meetsPolicy,
        firstClockIn: firstClockIn?.toISOString() || null,
        lastClockOut: lastClockOut?.toISOString() || null,
      })
      .eq("id", workDay.id)

    // Link all entries to this WorkDay
    const entryIds = dayEntries.map((e) => e.id)
    await supabase
      .from("Entry")
      .update({ workDayId: workDay.id })
      .in("id", entryIds)
  } else {
    // Create new WorkDay
    const { data: newWorkDay } = await supabase
      .from("WorkDay")
      .insert({
        date: dateStr,
        locationId,
        userId,
        totalMinutes,
        breakMinutes,
        meetsPolicy,
        firstClockIn: firstClockIn?.toISOString() || null,
        lastClockOut: lastClockOut?.toISOString() || null,
      })
      .select()
      .single()

    if (newWorkDay) {
      const entryIds = dayEntries.map((e) => e.id)
      await supabase
        .from("Entry")
        .update({ workDayId: newWorkDay.id })
        .in("id", entryIds)
    }
  }
}
