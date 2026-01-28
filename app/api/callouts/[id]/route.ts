import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Type assertion for callout model (schema exists but prisma generate couldn't run)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const calloutModel = (prisma as any).callout

// GET /api/callouts/[id] - Get a single callout
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const callout = await calloutModel.findUnique({
      where: { id },
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

    if (!callout) {
      return NextResponse.json(
        { error: "Callout not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(callout)
  } catch (error) {
    console.error("Error fetching callout:", error)
    return NextResponse.json(
      { error: "Failed to fetch callout" },
      { status: 500 }
    )
  }
}

// PATCH /api/callouts/[id] - Update a callout
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Check if callout exists
    const existingCallout = await calloutModel.findUnique({
      where: { id },
    })

    if (!existingCallout) {
      return NextResponse.json(
        { error: "Callout not found" },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (incidentNumber !== undefined) updateData.incidentNumber = incidentNumber
    if (locationId !== undefined) updateData.locationId = locationId
    if (timeReceived !== undefined) updateData.timeReceived = new Date(timeReceived)
    if (timeStarted !== undefined) updateData.timeStarted = timeStarted ? new Date(timeStarted) : null
    if (timeEnded !== undefined) updateData.timeEnded = timeEnded ? new Date(timeEnded) : null
    if (gpsLatitude !== undefined) updateData.gpsLatitude = gpsLatitude
    if (gpsLongitude !== undefined) updateData.gpsLongitude = gpsLongitude
    if (gpsAccuracy !== undefined) updateData.gpsAccuracy = gpsAccuracy
    if (description !== undefined) updateData.description = description
    if (resolution !== undefined) updateData.resolution = resolution

    const callout = await calloutModel.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(callout)
  } catch (error) {
    console.error("Error updating callout:", error)
    return NextResponse.json(
      { error: "Failed to update callout" },
      { status: 500 }
    )
  }
}

// DELETE /api/callouts/[id] - Delete a callout
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if callout exists
    const existingCallout = await calloutModel.findUnique({
      where: { id },
    })

    if (!existingCallout) {
      return NextResponse.json(
        { error: "Callout not found" },
        { status: 404 }
      )
    }

    await calloutModel.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting callout:", error)
    return NextResponse.json(
      { error: "Failed to delete callout" },
      { status: 500 }
    )
  }
}
