import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { validateBody } from "@/lib/validations"
import { z } from "zod"

const updateOrgSchema = z.object({
  name: z.string().min(1).max(100).optional(),
})

// GET /api/org - Get current user's org info
export async function GET() {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org) {
      return NextResponse.json({ org: null })
    }

    const { data: orgData } = await supabase
      .from("Organization")
      .select("*")
      .eq("id", org.orgId)
      .single()

    const { data: members } = await supabase
      .from("Membership")
      .select("id, userId, role, createdAt")
      .eq("orgId", org.orgId)

    const { data: policy } = await supabase
      .from("PolicyConfig")
      .select("*")
      .eq("orgId", org.orgId)
      .eq("isActive", true)
      .order("effectiveDate", { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      org: orgData,
      role: org.role,
      memberCount: members?.length || 0,
      policy,
    })
  } catch (error) {
    console.error("Error fetching org:", error)
    return NextResponse.json({ error: "Failed to fetch organization" }, { status: 500 })
  }
}

// PATCH /api/org - Update org (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org || org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const validation = validateBody(updateOrgSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (validation.data.name) updateData.name = validation.data.name

    const { data: updated, error } = await supabase
      .from("Organization")
      .update(updateData)
      .eq("id", org.orgId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to update organization" }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating org:", error)
    return NextResponse.json({ error: "Failed to update organization" }, { status: 500 })
  }
}
