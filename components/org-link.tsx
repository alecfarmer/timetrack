"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useMemo, type ComponentProps } from "react"

const RESERVED_PREFIXES = [
  "login",
  "signup",
  "auth",
  "api",
  "select-org",
  "forgot-password",
  "_next",
]

export function useOrgSlug(): string {
  const pathname = usePathname()
  const { org } = useAuth()

  return useMemo(() => {
    const segments = pathname.split("/").filter(Boolean)
    const first = segments[0]
    if (first && !RESERVED_PREFIXES.includes(first)) {
      return first
    }
    return org?.orgSlug || ""
  }, [pathname, org?.orgSlug])
}

/** Returns the pathname with the org slug prefix stripped */
export function useAppPathname(): string {
  const pathname = usePathname()

  return useMemo(() => {
    const segments = pathname.split("/").filter(Boolean)
    const first = segments[0]
    if (first && !RESERVED_PREFIXES.includes(first)) {
      // First segment is the org slug — strip it
      return "/" + segments.slice(1).join("/") || "/"
    }
    return pathname
  }, [pathname])
}

export function useOrgRouter() {
  const router = useRouter()
  const orgSlug = useOrgSlug()

  return useMemo(
    () => ({
      push: (path: string) => router.push(`/${orgSlug}${path}`),
      replace: (path: string) => router.replace(`/${orgSlug}${path}`),
      orgSlug,
    }),
    [router, orgSlug]
  )
}

type OrgLinkProps = ComponentProps<typeof Link>

export function OrgLink({ href, ...props }: OrgLinkProps) {
  const orgSlug = useOrgSlug()
  const hrefStr = typeof href === "string" ? href : href.pathname || ""

  const prefixed =
    hrefStr.startsWith("/") && orgSlug && !RESERVED_PREFIXES.some((r) => hrefStr.startsWith(`/${r}`))
      ? `/${orgSlug}${hrefStr}`
      : hrefStr

  return <Link href={prefixed} {...props} />
}
