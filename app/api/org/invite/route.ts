import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { validateBody } from "@/lib/validations"
import { z } from "zod"

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

const createInviteSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
  expiresInDays: z.number().min(1).max(30).default(7),
})

// GET /api/org/invite - List invites for the org (admin only)
export async function GET() {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org || org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { data: invites, error } = await supabase
      .from("Invite")
      .select("*")
      .eq("orgId", org.orgId)
      .order("createdAt", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch invites" }, { status: 500 })
    }

    return NextResponse.json(invites || [])
  } catch (error) {
    console.error("Error fetching invites:", error)
    return NextResponse.json({ error: "Failed to fetch invites" }, { status: 500 })
  }
}

// POST /api/org/invite - Create a new invite (admin only)
export async function POST(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org || org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const validation = validateBody(createInviteSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { email, role, expiresInDays } = validation.data
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    const code = generateInviteCode()

    const { data: invite, error } = await supabase
      .from("Invite")
      .insert({
        orgId: org.orgId,
        email: email || null,
        code,
        role,
        expiresAt: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Invite creation error:", error)
      return NextResponse.json({ error: "Failed to create invite" }, { status: 500 })
    }

    return NextResponse.json(invite, { status: 201 })
  } catch (error) {
    console.error("Error creating invite:", error)
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 })
  }
}

// DELETE /api/org/invite - Revoke an invite (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org || org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const id = request.nextUrl.searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Missing invite id" }, { status: 400 })
    }

    const { error } = await supabase
      .from("Invite")
      .delete()
      .eq("id", id)
      .eq("orgId", org.orgId)

    if (error) {
      return NextResponse.json({ error: "Failed to delete invite" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting invite:", error)
    return NextResponse.json({ error: "Failed to delete invite" }, { status: 500 })
  }
}
