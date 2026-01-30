import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

const DEFAULT_MAPPING = {
  provider: "csv",
  regularPayCode: "REG",
  overtimePayCode: "OT",
  calloutPayCode: "CALL",
  breakDeductionEnabled: false,
  roundingRule: "none",
  roundingIncrement: 15,
}

// GET /api/payroll/mapping - Fetch org's payroll mapping (admin only)
export async function GET() {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 })
    }

    if (org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { data: mapping, error } = await supabase
      .from("PayrollMapping")
      .select("*")
      .eq("orgId", org.orgId)
      .limit(1)
      .single()

    if (error || !mapping) {
      // No mapping exists yet — return defaults
      return NextResponse.json({ orgId: org.orgId, ...DEFAULT_MAPPING })
    }

    return NextResponse.json(mapping)
  } catch (error) {
    console.error("Error fetching payroll mapping:", error)
    return NextResponse.json({ error: "Failed to fetch payroll mapping" }, { status: 500 })
  }
}

// PATCH /api/payroll/mapping - Update payroll mapping (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 })
    }

    if (org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()

    // Only allow known fields
    const allowedFields = [
      "provider",
      "regularPayCode",
      "overtimePayCode",
      "calloutPayCode",
      "breakDeductionEnabled",
      "roundingRule",
      "roundingIncrement",
    ]
    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const { data: mapping, error } = await supabase
      .from("PayrollMapping")
      .upsert(
        { orgId: org.orgId, ...updates },
        { onConflict: "orgId" }
      )
      .select()
      .single()

    if (error) {
      console.error("Payroll mapping upsert error:", error)
      return NextResponse.json({ error: "Failed to update payroll mapping" }, { status: 500 })
    }

    return NextResponse.json(mapping)
  } catch (error) {
    console.error("Error updating payroll mapping:", error)
    return NextResponse.json({ error: "Failed to update payroll mapping" }, { status: 500 })
  }
}
