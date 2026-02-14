import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Routes that don't require an org slug prefix
const BARE_ROUTES = [
  "/login",
  "/signup",
  "/auth",
  "/select-org",
  "/forgot-password",
  "/api",
  "/pricing",
  "/faq",
  "/about",
  "/roadmap",
  "/legal",
  "/features",
]

function isBareRoute(pathname: string): boolean {
  return BARE_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  )
}

function isMarketingHost(hostname: string): boolean {
  const marketingDomain = process.env.NEXT_PUBLIC_MARKETING_DOMAIN
  if (!marketingDomain) return false
  return hostname === marketingDomain || hostname === `www.${marketingDomain}`
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not write any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const hostname = request.headers.get("host") || ""

  // --- Marketing domain handling ---
  // If on marketing domain, serve "/" only; redirect everything else to app domain
  if (isMarketingHost(hostname)) {
    if (pathname === "/") {
      return supabaseResponse
    }
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN
    if (appDomain) {
      const url = new URL(request.url)
      url.hostname = appDomain
      url.port = ""
      return NextResponse.redirect(url)
    }
  }

  // --- App domain (or localhost dev) ---

  // Bare routes: login, signup, auth, select-org, api — no slug needed
  if (pathname === "/" || isBareRoute(pathname)) {
    // Redirect unauthenticated users on protected bare routes
    if (!user && pathname === "/select-org") {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from auth pages to /select-org
    if (
      user &&
      (pathname.startsWith("/login") ||
        pathname.startsWith("/signup") ||
        pathname.startsWith("/auth/callback"))
    ) {
      const url = request.nextUrl.clone()
      url.pathname = "/select-org"
      return NextResponse.redirect(url)
    }

    // Root "/" on app domain when authenticated → /select-org
    if (user && pathname === "/") {
      const url = request.nextUrl.clone()
      url.pathname = "/select-org"
      return NextResponse.redirect(url)
    }

    // Root "/" when not authenticated → landing or /login
    if (!user && pathname === "/") {
      // In dev mode (no separate marketing domain), serve landing
      if (!process.env.NEXT_PUBLIC_MARKETING_DOMAIN) {
        return supabaseResponse
      }
      // On app domain in production, redirect to login
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  // --- Slug extraction ---
  // First path segment = org slug candidate
  const segments = pathname.split("/").filter(Boolean)
  const orgSlug = segments[0]
  const restPath = "/" + segments.slice(1).join("/")

  // Unauthenticated users on slug routes → /login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Rewrite: strip slug from URL, pass via header
  const rewriteUrl = request.nextUrl.clone()
  rewriteUrl.pathname = restPath === "/" ? "/dashboard" : restPath

  const response = NextResponse.rewrite(rewriteUrl)

  // Copy cookies from supabaseResponse to rewrite response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value)
  })

  response.headers.set("x-org-slug", orgSlug)

  return response
}
