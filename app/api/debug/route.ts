import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// GET /api/debug - Test database connection
export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    supabaseUrlSet: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKeySet: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    nodeEnv: process.env.NODE_ENV,
  }

  try {
    // Try to count locations
    const { count: locationCount, error: countError } = await supabase
      .from("Location")
      .select("*", { count: "exact", head: true })

    if (countError) {
      diagnostics.connectionTest = "FAILED"
      diagnostics.error = {
        message: countError.message,
        code: countError.code,
        details: countError.details,
        hint: countError.hint,
      }
      return NextResponse.json(diagnostics, { status: 500 })
    }

    diagnostics.connectionTest = "SUCCESS"
    diagnostics.locationCount = locationCount

    // Try to fetch sample locations
    const { data: locations, error: fetchError } = await supabase
      .from("Location")
      .select("id, name, category")
      .limit(5)

    if (fetchError) {
      diagnostics.fetchError = fetchError.message
    } else {
      diagnostics.sampleLocations = locations
    }

    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error("Database diagnostic error:", error)

    diagnostics.connectionTest = "FAILED"
    diagnostics.error = error instanceof Error ? {
      name: error.name,
      message: error.message,
    } : String(error)

    return NextResponse.json(diagnostics, { status: 500 })
  }
}
