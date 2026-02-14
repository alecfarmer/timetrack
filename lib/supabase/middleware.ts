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

// Routes served on app.usekpr.com (auth + API + app)
const APP_ROUTES = [
  "/login",
  "/signup",
  "/auth",
  "/select-org",
  "/forgot-password",
  "/api",
]

function isAppRoute(pathname: string): boolean {
  return APP_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  )
}

function isAppHost(hostname: string): boolean {
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN
  if (!appDomain) return false
  return hostname === appDomain
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

  // --- app.usekpr.com ---
  // Serves: login, signup, auth, select-org, forgot-password, API, and /{slug}/* app routes
  // Anything else (marketing pages) → redirect to usekpr.com
  if (isAppHost(hostname)) {
    // App routes and slug routes are served here
    if (isAppRoute(pathname)) {
      // Redirect unauthenticated users on protected routes
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

      return supabaseResponse
    }

    // Root "/" on app domain → dashboard if authed, login if not
    if (pathname === "/") {
      const url = request.nextUrl.clone()
      url.pathname = user ? "/select-org" : "/login"
      return NextResponse.redirect(url)
    }

    // Non-app routes on app domain that aren't slug routes → redirect to usekpr.com
    if (isBareRoute(pathname)) {
      const mainDomain = process.env.NEXT_PUBLIC_MARKETING_DOMAIN || "usekpr.com"
      const url = new URL(request.url)
      url.hostname = mainDomain
      url.port = ""
      return NextResponse.redirect(url)
    }

    // Fall through to slug extraction below
  }

  // --- usekpr.com (marketing + public pages) ---
  if (!isAppHost(hostname)) {
    if (pathname === "/" || isBareRoute(pathname)) {
      // Root "/" when authenticated → redirect to app domain /select-org
      if (user && pathname === "/") {
        const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN
        if (appDomain) {
          const url = new URL(request.url)
          url.hostname = appDomain
          url.port = ""
          url.pathname = "/select-org"
          return NextResponse.redirect(url)
        }
        const url = request.nextUrl.clone()
        url.pathname = "/select-org"
        return NextResponse.redirect(url)
      }

      // Auth pages on marketing domain → redirect to app domain
      if (isAppRoute(pathname)) {
        const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN
        if (appDomain) {
          const url = new URL(request.url)
          url.hostname = appDomain
          url.port = ""
          return NextResponse.redirect(url)
        }
      }

      return supabaseResponse
    }

    // Slug routes on marketing domain → redirect to app domain
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN
    if (appDomain) {
      const url = new URL(request.url)
      url.hostname = appDomain
      url.port = ""
      return NextResponse.redirect(url)
    }
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
