import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { validateBody } from "@/lib/validations"
import { z } from "zod"

const updatePolicySchema = z.object({
  requiredDaysPerWeek: z.number().min(0).max(7).optional(),
  minimumMinutesPerDay: z.number().min(0).max(1440).optional(),
})

// GET /api/org/policy - Get the active policy for the user's org
export async function GET() {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 })
    }

    const { data: policy, error } = await supabase
      .from("PolicyConfig")
      .select("*")
      .eq("orgId", org.orgId)
      .eq("isActive", true)
      .order("effectiveDate", { ascending: false })
      .limit(1)
      .single()

    if (error || !policy) {
      return NextResponse.json({
        requiredDaysPerWeek: 3,
        minimumMinutesPerDay: 0,
      })
    }

    return NextResponse.json(policy)
  } catch (error) {
    console.error("Error fetching policy:", error)
    return NextResponse.json({ error: "Failed to fetch policy" }, { status: 500 })
  }
}

// PATCH /api/org/policy - Update the org policy (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org || org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const validation = validateBody(updatePolicySchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from("PolicyConfig")
      .select("id")
      .eq("orgId", org.orgId)
      .eq("isActive", true)
      .order("effectiveDate", { ascending: false })
      .limit(1)
      .single()

    if (existing) {
      const updateData: Record<string, unknown> = {}
      if (validation.data.requiredDaysPerWeek !== undefined) {
        updateData.requiredDaysPerWeek = validation.data.requiredDaysPerWeek
      }
      if (validation.data.minimumMinutesPerDay !== undefined) {
        updateData.minimumMinutesPerDay = validation.data.minimumMinutesPerDay
      }

      const { data: updated, error } = await supabase
        .from("PolicyConfig")
        .update(updateData)
        .eq("id", existing.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: "Failed to update policy" }, { status: 500 })
      }

      return NextResponse.json(updated)
    } else {
      // Create new policy
      const { data: created, error } = await supabase
        .from("PolicyConfig")
        .insert({
          name: "Default Policy",
          orgId: org.orgId,
          isActive: true,
          requiredDaysPerWeek: validation.data.requiredDaysPerWeek ?? 3,
          minimumMinutesPerDay: validation.data.minimumMinutesPerDay ?? 0,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: "Failed to create policy" }, { status: 500 })
      }

      return NextResponse.json(created, { status: 201 })
    }
  } catch (error) {
    console.error("Error updating policy:", error)
    return NextResponse.json({ error: "Failed to update policy" }, { status: 500 })
  }
}
