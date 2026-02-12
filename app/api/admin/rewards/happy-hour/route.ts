import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { z } from "zod/v4"
import { validateBody } from "@/lib/validations"

const happyHourSchema = z.object({
  enabled: z.boolean(),
  dayOfWeek: z.number().int().min(0).max(6).optional(), // 0=Sun, 6=Sat
  startHour: z.number().int().min(0).max(23).optional(),
  endHour: z.number().int().min(0).max(23).optional(),
  multiplier: z.number().min(1.5).max(5.0).default(2.0),
})

export async function POST(request: NextRequest) {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const validated = validateBody(happyHourSchema, body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const { enabled, dayOfWeek, startHour, endHour, multiplier } = validated.data

    // Get current features
    const { data: orgData } = await supabase
      .from("Organization")
      .select("features")
      .eq("id", org.orgId)
      .single()

    const features = (orgData?.features as Record<string, unknown>) || {}

    if (enabled) {
      if (dayOfWeek === undefined || startHour === undefined || endHour === undefined) {
        return NextResponse.json({ error: "dayOfWeek, startHour, and endHour are required when enabled" }, { status: 400 })
      }

      features.happyHour = {
        enabled: true,
        dayOfWeek,
        startHour,
        endHour,
        multiplier,
      }
    } else {
      features.happyHour = null
    }

    const { error } = await supabase
      .from("Organization")
      .update({ features })
      .eq("id", org.orgId)

    if (error) throw error

    return NextResponse.json({ success: true, happyHour: features.happyHour })
  } catch (error) {
    console.error("Happy hour config error:", error)
    return NextResponse.json({ error: "Failed to configure happy hour" }, { status: 500 })
  }
}
