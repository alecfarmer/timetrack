import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET /api/debug - Test database connection
export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    databaseUrlSet: !!process.env.DATABASE_URL,
    databaseUrlHost: process.env.DATABASE_URL
      ? new URL(process.env.DATABASE_URL.replace(/^postgresql/, "http")).hostname
      : "not set",
    directUrlSet: !!process.env.DIRECT_URL,
    nodeEnv: process.env.NODE_ENV,
  }

  try {
    // Test raw query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    diagnostics.connectionTest = "SUCCESS"
    diagnostics.queryResult = result

    // Try to count locations
    const locationCount = await prisma.location.count()
    diagnostics.locationCount = locationCount

    // Try to fetch locations
    const locations = await prisma.location.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        category: true,
      },
    })
    diagnostics.sampleLocations = locations

    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error("Database diagnostic error:", error)

    diagnostics.connectionTest = "FAILED"
    diagnostics.error = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack?.split("\n").slice(0, 5),
    } : String(error)

    return NextResponse.json(diagnostics, { status: 500 })
  }
}
