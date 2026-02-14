import { NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

export async function GET() {
  const { user, error: authError } = await getAuthUser()
  if (authError) return authError

  const { data: memberships, error } = await supabase
    .from("Membership")
    .select(
      `
      orgId,
      role,
      org:Organization (id, name, slug)
    `
    )
    .eq("userId", user!.id)

  if (error) {
    console.error("Error fetching orgs:", error)
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    )
  }

  const orgs = (memberships || [])
    .filter((m) => m.org)
    .map((m) => {
      const orgData = Array.isArray(m.org) ? m.org[0] : m.org
      return {
        orgId: m.orgId,
        orgName: orgData.name,
        orgSlug: orgData.slug,
        role: m.role,
      }
    })

  return NextResponse.json({ orgs })
}
