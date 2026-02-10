import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { leaveAllowanceOverrideSchema, validateBody } from "@/lib/validations"

// GET /api/org/leave-allowances — list all overrides for org (admin)
export async function GET() {
  try {
    const { org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org || org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("LeaveAllowanceOverride")
      .select("*")
      .eq("orgId", org.orgId)
      .order("createdAt", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch overrides" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error fetching leave allowance overrides:", error)
    return NextResponse.json({ error: "Failed to fetch overrides" }, { status: 500 })
  }
}

// POST /api/org/leave-allowances — create/update override (admin)
export async function POST(request: NextRequest) {
  try {
    const { org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org || org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const validation = validateBody(leaveAllowanceOverrideSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { userId, annualPtoDays, effectiveYear, notes } = validation.data

    // Verify user is a member of the org
    const { data: membership } = await supabase
      .from("Membership")
      .select("id")
      .eq("userId", userId)
      .eq("orgId", org.orgId)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "User is not a member of this organization" }, { status: 400 })
    }

    // Upsert on (userId, orgId, effectiveYear)
    const { data, error } = await supabase
      .from("LeaveAllowanceOverride")
      .upsert(
        {
          userId,
          orgId: org.orgId,
          annualPtoDays,
          effectiveYear: effectiveYear ?? null,
          notes: notes ?? null,
          updatedAt: new Date().toISOString(),
        },
        { onConflict: "userId,orgId,effectiveYear" }
      )
      .select()
      .single()

    if (error) {
      console.error("Upsert error:", error)
      return NextResponse.json({ error: "Failed to save override" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error saving leave allowance override:", error)
    return NextResponse.json({ error: "Failed to save override" }, { status: 500 })
  }
}

// DELETE /api/org/leave-allowances?id=xxx — remove override (admin)
export async function DELETE(request: NextRequest) {
  try {
    const { org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org || org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const id = request.nextUrl.searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Override id required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("LeaveAllowanceOverride")
      .delete()
      .eq("id", id)
      .eq("orgId", org.orgId)

    if (error) {
      return NextResponse.json({ error: "Failed to delete override" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting leave allowance override:", error)
    return NextResponse.json({ error: "Failed to delete override" }, { status: 500 })
  }
}
