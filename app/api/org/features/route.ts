import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

export interface OrgFeatures {
  photoVerification: boolean
  breakTracking: boolean
  timesheetApproval: boolean
  alerts: boolean
  analytics: boolean
  manualCorrections: boolean
  auditLog: boolean
}

const DEFAULT_FEATURES: OrgFeatures = {
  photoVerification: false,
  breakTracking: false,
  timesheetApproval: false,
  alerts: true,
  analytics: true,
  manualCorrections: true,
  auditLog: true,
}

// GET /api/org/features - Get org feature flags
export async function GET() {
  try {
    const { org, error: authError } = await getAuthUser()
    if (authError) return authError
    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 })
    }

    const { data: orgData } = await supabase
      .from("Organization")
      .select("features")
      .eq("id", org.orgId)
      .single()

    const features = { ...DEFAULT_FEATURES, ...(orgData?.features as Partial<OrgFeatures> || {}) }
    return NextResponse.json(features)
  } catch (error) {
    console.error("Error fetching features:", error)
    return NextResponse.json({ error: "Failed to fetch features" }, { status: 500 })
  }
}

// PATCH /api/org/features - Update org feature flags (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const { org, error: authError } = await getAuthUser()
    if (authError) return authError
    if (!org || org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()

    // Get current features
    const { data: orgData } = await supabase
      .from("Organization")
      .select("features")
      .eq("id", org.orgId)
      .single()

    const currentFeatures = { ...DEFAULT_FEATURES, ...(orgData?.features as Partial<OrgFeatures> || {}) }

    // Only allow updating known feature keys
    const validKeys = Object.keys(DEFAULT_FEATURES) as (keyof OrgFeatures)[]
    const updates: Partial<OrgFeatures> = {}
    for (const key of validKeys) {
      if (typeof body[key] === "boolean") {
        updates[key] = body[key]
      }
    }

    const newFeatures = { ...currentFeatures, ...updates }

    const { error } = await supabase
      .from("Organization")
      .update({ features: newFeatures })
      .eq("id", org.orgId)

    if (error) {
      return NextResponse.json({ error: "Failed to update features" }, { status: 500 })
    }

    return NextResponse.json(newFeatures)
  } catch (error) {
    console.error("Error updating features:", error)
    return NextResponse.json({ error: "Failed to update features" }, { status: 500 })
  }
}
