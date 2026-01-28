import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { startOfDay, endOfDay } from "date-fns"
import { toZonedTime } from "date-fns-tz"

const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || "America/New_York"

// GET /api/entries - List entries with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const locationId = searchParams.get("locationId")
    const date = searchParams.get("date")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: Record<string, unknown> = {}

    if (locationId) {
      where.locationId = locationId
    }

    if (date) {
      const targetDate = new Date(date)
      const zonedDate = toZonedTime(targetDate, DEFAULT_TIMEZONE)
      where.timestampServer = {
        gte: startOfDay(zonedDate),
        lte: endOfDay(zonedDate),
      }
    }

    const entries = await prisma.entry.findMany({
      where,
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
      take: limit,
      skip: offset,
    })

    const total = await prisma.entry.count({ where })

    return NextResponse.json({
      entries,
      total,
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
    const body = await request.json()
    const {
      type,
      locationId,
      timestampClient,
      gpsLatitude,
      gpsLongitude,
      gpsAccuracy,
      notes,
    } = body

    // Validate required fields
    if (!type || !locationId) {
      return NextResponse.json(
        { error: "Missing required fields: type, locationId" },
        { status: 400 }
      )
    }

    if (!["CLOCK_IN", "CLOCK_OUT"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid entry type. Must be CLOCK_IN or CLOCK_OUT" },
        { status: 400 }
      )
    }

    // Verify location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    })

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      )
    }

    // Create the entry
    const entry = await prisma.entry.create({
      data: {
        type,
        locationId,
        timestampClient: timestampClient ? new Date(timestampClient) : new Date(),
        gpsLatitude,
        gpsLongitude,
        gpsAccuracy,
        notes,
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
    })

    // Update or create WorkDay
    const serverDate = entry.timestampServer
    const zonedDate = toZonedTime(serverDate, DEFAULT_TIMEZONE)
    const workDayDate = startOfDay(zonedDate)

    const existingWorkDay = await prisma.workDay.findUnique({
      where: {
        date_locationId: {
          date: workDayDate,
          locationId,
        },
      },
    })

    if (existingWorkDay) {
      const updateData: Record<string, unknown> = {}

      if (type === "CLOCK_IN") {
        if (!existingWorkDay.firstClockIn || serverDate < existingWorkDay.firstClockIn) {
          updateData.firstClockIn = serverDate
        }
      } else {
        if (!existingWorkDay.lastClockOut || serverDate > existingWorkDay.lastClockOut) {
          updateData.lastClockOut = serverDate
        }
      }

      if (existingWorkDay.firstClockIn && (updateData.lastClockOut || existingWorkDay.lastClockOut)) {
        const clockOut = (updateData.lastClockOut || existingWorkDay.lastClockOut) as Date
        const totalMinutes = Math.floor(
          (clockOut.getTime() - existingWorkDay.firstClockIn.getTime()) / 60000
        )
        updateData.totalMinutes = totalMinutes
        updateData.meetsPolicy = totalMinutes > 0
      }

      await prisma.workDay.update({
        where: { id: existingWorkDay.id },
        data: updateData,
      })

      await prisma.entry.update({
        where: { id: entry.id },
        data: { workDayId: existingWorkDay.id },
      })
    } else {
      const workDay = await prisma.workDay.create({
        data: {
          date: workDayDate,
          locationId,
          firstClockIn: type === "CLOCK_IN" ? serverDate : null,
          lastClockOut: type === "CLOCK_OUT" ? serverDate : null,
          meetsPolicy: type === "CLOCK_IN",
        },
      })

      await prisma.entry.update({
        where: { id: entry.id },
        data: { workDayId: workDay.id },
      })
    }

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error("Error creating entry:", error)
    return NextResponse.json(
      { error: "Failed to create entry" },
      { status: 500 }
    )
  }
}
