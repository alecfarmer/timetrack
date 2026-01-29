import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

/**
 * Get the authenticated user from the Supabase session cookie.
 * Returns the user object or a 401/429 JSON response.
 */
export async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      user: null,
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
      error: NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429 }
      ),
    }
  }

  return { user, error: null }
}
