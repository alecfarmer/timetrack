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

const bulkInviteSchema = z.object({
  emails: z.array(z.string().email()).min(1).max(50),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
  expiresInDays: z.number().min(1).max(30).default(7),
})

// POST /api/org/invite/bulk - Create multiple invites (admin only)
export async function POST(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org || org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const validation = validateBody(bulkInviteSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { emails, role, expiresInDays } = validation.data
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    const results = await Promise.all(
      emails.map(async (email) => {
        const code = generateInviteCode()
        const { data: invite, error } = await supabase
          .from("Invite")
          .insert({
            orgId: org.orgId,
            email,
            code,
            role,
            expiresAt: expiresAt.toISOString(),
          })
          .select()
          .single()

        if (error) {
          return { email, error: error.message }
        }
        return { email, invite }
      })
    )

    const successful = results.filter((r) => !("error" in r && !("invite" in r)))
    const failed = results.filter((r) => "error" in r && !("invite" in r))

    return NextResponse.json({
      results,
      summary: {
        total: emails.length,
        successful: successful.length,
        failed: failed.length,
      },
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating bulk invites:", error)
    return NextResponse.json({ error: "Failed to create invites" }, { status: 500 })
  }
}
