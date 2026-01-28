import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns"
import { toZonedTime } from "date-fns-tz"

const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || "America/New_York"

// GET /api/callouts - List callouts with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const locationId = searchParams.get("locationId")
    const date = searchParams.get("date")
    const month = searchParams.get("month") // Format: YYYY-MM
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: Record<string, unknown> = {}

    if (locationId) {
      where.locationId = locationId
    }

    if (date) {
      const targetDate = new Date(date)
      const zonedDate = toZonedTime(targetDate, DEFAULT_TIMEZONE)
      where.timeReceived = {
        gte: startOfDay(zonedDate),
        lte: endOfDay(zonedDate),
      }
    } else if (month) {
      const [year, monthNum] = month.split("-").map(Number)
      const targetDate = new Date(year, monthNum - 1, 1)
      const zonedDate = toZonedTime(targetDate, DEFAULT_TIMEZONE)
      where.timeReceived = {
        gte: startOfMonth(zonedDate),
        lte: endOfMonth(zonedDate),
      }
    }

    const callouts = await prisma.callout.findMany({
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
        timeReceived: "desc",
      },
      take: limit,
      skip: offset,
    })

    const total = await prisma.callout.count({ where })

    return NextResponse.json({
      callouts,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching callouts:", error)
    return NextResponse.json(
      { error: "Failed to fetch callouts" },
      { status: 500 }
    )
  }
}

// POST /api/callouts - Create a new callout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      incidentNumber,
      locationId,
      timeReceived,
      timeStarted,
      timeEnded,
      gpsLatitude,
      gpsLongitude,
      gpsAccuracy,
      description,
      resolution,
    } = body

    // Validate required fields
    if (!incidentNumber || !locationId || !timeReceived) {
      return NextResponse.json(
        { error: "Missing required fields: incidentNumber, locationId, timeReceived" },
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

    // Create the callout
    const callout = await prisma.callout.create({
      data: {
        incidentNumber,
        locationId,
        timeReceived: new Date(timeReceived),
        timeStarted: timeStarted ? new Date(timeStarted) : null,
        timeEnded: timeEnded ? new Date(timeEnded) : null,
        gpsLatitude,
        gpsLongitude,
        gpsAccuracy,
        description,
        resolution,
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

    return NextResponse.json(callout, { status: 201 })
  } catch (error) {
    console.error("Error creating callout:", error)
    return NextResponse.json(
      { error: "Failed to create callout" },
      { status: 500 }
    )
  }
}
