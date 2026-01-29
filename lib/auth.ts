import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * Get the authenticated user from the Supabase session cookie.
 * Returns the user object or a 401 JSON response if not authenticated.
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

  return { user, error: null }
}
