import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { validateBody } from "@/lib/validations"
import { z } from "zod"

// ─── Known Jurisdictions ────────────────────────────────────────
export const KNOWN_JURISDICTIONS = [
  { code: "US-CA", name: "California", features: { mealBreakRequired: true, mealBreakAfterMinutes: 300, mealBreakDuration: 30, restBreakRequired: true, restBreakInterval: 240, restBreakDuration: 10, overtimeThresholdDaily: 480 } },
  { code: "US-NY", name: "New York", features: { overtimeThresholdWeekly: 2400 } },
  { code: "US-OR", name: "Oregon", features: { predictiveScheduling: true, advanceNoticeHours: 336 } },
  { code: "US-WA-SEA", name: "Seattle", features: { predictiveScheduling: true, advanceNoticeHours: 336, clopeningMinHours: 10 } },
  { code: "US-IL-CHI", name: "Chicago", features: { predictiveScheduling: true, advanceNoticeHours: 336, clopeningMinHours: 10 } },
  { code: "US-CA-SF", name: "San Francisco", features: { predictiveScheduling: true, advanceNoticeHours: 336 } },
  { code: "US-CA-LA", name: "Los Angeles", features: { predictiveScheduling: true, advanceNoticeHours: 336 } },
  { code: "US-PA-PHL", name: "Philadelphia", features: { predictiveScheduling: true, advanceNoticeHours: 336, clopeningMinHours: 10 } },
  { code: "DEFAULT", name: "Federal Default", features: { overtimeThresholdWeekly: 2400 } },
]

// ─── Schemas ────────────────────────────────────────────────────
const createJurisdictionPolicySchema = z.object({
  jurisdiction: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  requiredDaysPerWeek: z.number().min(0).max(7).optional(),
  minimumMinutesPerDay: z.number().min(0).max(1440).optional(),
  breakMinutesPerDay: z.number().min(0).max(1440).optional(),
  autoDeductBreak: z.boolean().optional(),
  overtimeThresholdDaily: z.number().min(0).optional(),
  overtimeThresholdWeekly: z.number().min(0).optional(),
  mealBreakRequired: z.boolean().optional(),
  mealBreakAfterMinutes: z.number().min(0).optional(),
  mealBreakDuration: z.number().min(0).optional(),
  restBreakRequired: z.boolean().optional(),
  restBreakInterval: z.number().min(0).optional(),
  restBreakDuration: z.number().min(0).optional(),
  predictiveScheduling: z.boolean().optional(),
  advanceNoticeHours: z.number().min(0).optional(),
  clopeningMinHours: z.number().min(0).optional(),
})

const updateJurisdictionPolicySchema = z.object({
  policyId: z.string().min(1),
  jurisdiction: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(200).optional(),
  requiredDaysPerWeek: z.number().min(0).max(7).optional(),
  minimumMinutesPerDay: z.number().min(0).max(1440).optional(),
  breakMinutesPerDay: z.number().min(0).max(1440).optional(),
  autoDeductBreak: z.boolean().optional(),
  overtimeThresholdDaily: z.number().min(0).optional(),
  overtimeThresholdWeekly: z.number().min(0).optional(),
  mealBreakRequired: z.boolean().optional(),
  mealBreakAfterMinutes: z.number().min(0).optional(),
  mealBreakDuration: z.number().min(0).optional(),
  restBreakRequired: z.boolean().optional(),
  restBreakInterval: z.number().min(0).optional(),
  restBreakDuration: z.number().min(0).optional(),
  predictiveScheduling: z.boolean().optional(),
  advanceNoticeHours: z.number().min(0).optional(),
  clopeningMinHours: z.number().min(0).optional(),
})

// ─── Effective Policy Resolver ──────────────────────────────────
/**
 * Determines which policy applies for a given org + optional location.
 * If a location is provided, looks for a jurisdiction-specific policy first.
 * Falls back to the org default policy (jurisdiction IS NULL) if none found.
 */
export async function getEffectivePolicy(orgId: string, locationId?: string) {
  let jurisdiction: string | null = null

  // If a location is provided, resolve its jurisdiction
  if (locationId) {
    const { data: location } = await supabase
      .from("Location")
      .select("jurisdiction")
      .eq("id", locationId)
      .eq("orgId", orgId)
      .single()

    jurisdiction = location?.jurisdiction ?? null
  }

  // Try jurisdiction-specific policy first
  if (jurisdiction) {
    const { data: policy } = await supabase
      .from("PolicyConfig")
      .select("*")
      .eq("orgId", orgId)
      .eq("jurisdiction", jurisdiction)
      .eq("isActive", true)
      .order("effectiveDate", { ascending: false })
      .limit(1)
      .single()

    if (policy) return policy
  }

  // Fall back to org default policy (no jurisdiction)
  const { data: defaultPolicy } = await supabase
    .from("PolicyConfig")
    .select("*")
    .eq("orgId", orgId)
    .is("jurisdiction", null)
    .eq("isActive", true)
    .order("effectiveDate", { ascending: false })
    .limit(1)
    .single()

  if (defaultPolicy) return defaultPolicy

  // Return hard-coded defaults if nothing is configured
  return {
    id: null,
    orgId,
    jurisdiction: null,
    name: "System Default",
    isActive: true,
    requiredDaysPerWeek: 3,
    minimumMinutesPerDay: 0,
    overtimeThresholdWeekly: 2400,
  }
}

// ─── GET /api/org/policy/jurisdictions ──────────────────────────
export async function GET() {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org || org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { data: policies, error } = await supabase
      .from("PolicyConfig")
      .select("*")
      .eq("orgId", org.orgId)
      .order("jurisdiction", { ascending: true, nullsFirst: true })

    if (error) {
      console.error("Error fetching jurisdiction policies:", error)
      return NextResponse.json({ error: "Failed to fetch policies" }, { status: 500 })
    }

    return NextResponse.json({
      policies: policies ?? [],
      knownJurisdictions: KNOWN_JURISDICTIONS,
    })
  } catch (error) {
    console.error("Error fetching jurisdiction policies:", error)
    return NextResponse.json({ error: "Failed to fetch policies" }, { status: 500 })
  }
}

// ─── POST /api/org/policy/jurisdictions ─────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org || org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const validation = validateBody(createJurisdictionPolicySchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { jurisdiction, name, ...policyFields } = validation.data

    // Check for duplicate jurisdiction policy
    const { data: existing } = await supabase
      .from("PolicyConfig")
      .select("id")
      .eq("orgId", org.orgId)
      .eq("jurisdiction", jurisdiction)
      .eq("isActive", true)
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: `A policy for jurisdiction "${jurisdiction}" already exists` },
        { status: 409 }
      )
    }

    const { data: created, error } = await supabase
      .from("PolicyConfig")
      .insert({
        orgId: org.orgId,
        jurisdiction,
        name,
        isActive: true,
        ...policyFields,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating jurisdiction policy:", error)
      return NextResponse.json({ error: "Failed to create policy" }, { status: 500 })
    }

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Error creating jurisdiction policy:", error)
    return NextResponse.json({ error: "Failed to create policy" }, { status: 500 })
  }
}

// ─── PATCH /api/org/policy/jurisdictions ────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org || org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const validation = validateBody(updateJurisdictionPolicySchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { policyId, ...updateFields } = validation.data

    // Filter out undefined fields
    const updateData: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        updateData[key] = value
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from("PolicyConfig")
      .update(updateData)
      .eq("id", policyId)
      .eq("orgId", org.orgId)
      .select()
      .single()

    if (error) {
      console.error("Error updating jurisdiction policy:", error)
      return NextResponse.json({ error: "Failed to update policy" }, { status: 500 })
    }

    if (!updated) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating jurisdiction policy:", error)
    return NextResponse.json({ error: "Failed to update policy" }, { status: 500 })
  }
}
