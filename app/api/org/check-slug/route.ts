import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"

const RESERVED_SLUGS = new Set([
  "login",
  "signup",
  "auth",
  "api",
  "select-org",
  "forgot-password",
  "admin",
  "app",
  "www",
  "help",
  "support",
  "billing",
  "settings",
  "onboarding",
  "kpr",
  "usekpr",
])

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.toLowerCase().trim()

  if (!slug) {
    return NextResponse.json(
      { available: false, reason: "Slug is required" },
      { status: 400 }
    )
  }

  if (slug.length < 2 || slug.length > 50) {
    return NextResponse.json({
      available: false,
      reason: "Slug must be between 2 and 50 characters",
    })
  }

  if (!SLUG_REGEX.test(slug)) {
    return NextResponse.json({
      available: false,
      reason:
        "Slug must contain only lowercase letters, numbers, and hyphens. Cannot start or end with a hyphen.",
    })
  }

  if (RESERVED_SLUGS.has(slug)) {
    return NextResponse.json({
      available: false,
      reason: "This slug is reserved",
    })
  }

  const { data: existing } = await supabase
    .from("Organization")
    .select("id")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({
      available: false,
      reason: "This slug is already taken",
    })
  }

  return NextResponse.json({ available: true })
}
