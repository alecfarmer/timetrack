import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { supabaseAdmin as supabase } from "@/lib/supabase"

interface OrgContext {
  orgId: string
  role: "ADMIN" | "MEMBER"
}

/**
 * Get the authenticated user from the Supabase session cookie.
 * Returns the user object, their org context, or a 401/429 JSON response.
 */
export async function getAuthUser() {
  const serverSupabase = await createClient()
  const {
    data: { user },
    error,
  } = await serverSupabase.auth.getUser()

  if (error || !user) {
    return {
      user: null,
      org: null as OrgContext | null,
      error: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    }
  }

  // Rate limit per user: 60 requests/minute
  const { limited } = rateLimit(user.id)
  if (limited) {
    return {
      user: null,
      org: null as OrgContext | null,
      error: NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429 }
      ),
    }
  }

  // Look up org membership
  const { data: membership } = await supabase
    .from("Membership")
    .select("orgId, role")
    .eq("userId", user.id)
    .limit(1)
    .single()

  const org: OrgContext | null = membership
    ? { orgId: membership.orgId, role: membership.role as "ADMIN" | "MEMBER" }
    : null

  return { user, org, error: null }
}
