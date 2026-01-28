import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { startOfDay, endOfDay } from "date-fns"
import { toZonedTime } from "date-fns-tz"

const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || "America/New_York"

interface EntryWithLocation {
  id: string
  type: string
  timestampServer: Date
  location: { id: string; name: string; code: string | null }
}

// GET /api/entries/current - Get current clock status
export async function GET() {
  try {
    const now = new Date()
    const zonedNow = toZonedTime(now, DEFAULT_TIMEZONE)
    const todayStart = startOfDay(zonedNow)
    const todayEnd = endOfDay(zonedNow)

    const dbEntries = await prisma.entry.findMany({
      where: {
        timestampServer: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        timestampServer: "desc",
      },
    })

    const todayEntries: EntryWithLocation[] = dbEntries.map((e) => ({
      id: e.id,
      type: e.type,
      timestampServer: e.timestampServer,
      location: {
        id: e.location?.id || "",
        name: e.location?.name || "Unknown",
        code: e.location?.code ?? null,
      },
    }))

    // Determine if currently clocked in
    // User is clocked in if the most recent entry is a CLOCK_IN
    const latestEntry = todayEntries[0]
    const isClockedIn = latestEntry?.type === "CLOCK_IN"

    // Get the active clock-in entry if clocked in
    const activeClockIn = isClockedIn ? latestEntry : null

    // Calculate time worked today
    let totalMinutesToday = 0
    let currentSessionStart: Date | null = null

    // Process entries in chronological order
    const chronologicalEntries = [...todayEntries].reverse()
    let clockInTime: Date | null = null

    for (const entry of chronologicalEntries) {
      if (entry.type === "CLOCK_IN") {
        clockInTime = entry.timestampServer
        if (isClockedIn && entry.id === activeClockIn?.id) {
          currentSessionStart = clockInTime
        }
      } else if (entry.type === "CLOCK_OUT" && clockInTime) {
        const sessionMinutes = Math.floor(
          (entry.timestampServer.getTime() - clockInTime.getTime()) / 60000
        )
        totalMinutesToday += sessionMinutes
        clockInTime = null
      }
    }

    // Add current session time if still clocked in
    if (isClockedIn && currentSessionStart) {
      const currentSessionMinutes = Math.floor(
        (now.getTime() - currentSessionStart.getTime()) / 60000
      )
      totalMinutesToday += currentSessionMinutes
    }

    return NextResponse.json({
      isClockedIn,
      activeClockIn,
      currentSessionStart: currentSessionStart?.toISOString() || null,
      todayEntries,
      totalMinutesToday,
    })
  } catch (error) {
    console.error("Error fetching current status:", error)
    // Return empty status on error
    return NextResponse.json({
      isClockedIn: false,
      activeClockIn: null,
      currentSessionStart: null,
      todayEntries: [],
      totalMinutesToday: 0,
    })
  }
}
