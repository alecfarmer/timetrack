"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

interface OrgInfo {
  orgId: string
  orgName: string
  orgSlug: string
  role: "ADMIN" | "MEMBER"
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  orgLoading: boolean
  org: OrgInfo | null
  isAdmin: boolean
  refreshOrg: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  orgLoading: true,
  org: null,
  isAdmin: false,
  refreshOrg: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [orgLoading, setOrgLoading] = useState(true)
  const [org, setOrg] = useState<OrgInfo | null>(null)
  const supabase = createClient()

  const fetchOrg = useCallback(async (userId: string) => {
    setOrgLoading(true)
    try {
      const { data: membership, error } = await supabase
        .from("Membership")
        .select(`
          orgId,
          role,
          org:Organization (id, name, slug)
        `)
        .eq("userId", userId)
        .limit(1)
        .single()

      if (error) {
        console.error("Error fetching org membership:", error)
        setOrg(null)
        return
      }

      if (membership?.org) {
        const orgData = Array.isArray(membership.org) ? membership.org[0] : membership.org
        setOrg({
          orgId: membership.orgId,
          orgName: orgData.name,
          orgSlug: orgData.slug,
          role: membership.role as "ADMIN" | "MEMBER",
        })
      } else {
        setOrg(null)
      }
    } catch (error) {
      console.error("Error in fetchOrg:", error)
      setOrg(null)
    } finally {
      setOrgLoading(false)
    }
  }, [supabase])

  const refreshOrg = useCallback(async () => {
    if (user) {
      await fetchOrg(user.id)
    }
  }, [user, fetchOrg])

  useEffect(() => {
    let isMounted = true

    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
        }

        if (!isMounted) return

        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        if (session?.user) {
          fetchOrg(session.user.id)
        } else {
          setOrgLoading(false)
        }
      } catch (error) {
        console.error("Error in getSession:", error)
        if (isMounted) {
          setLoading(false)
          setOrgLoading(false)
        }
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      if (!isMounted) return

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      if (session?.user) {
        fetchOrg(session.user.id)
      } else {
        setOrg(null)
        setOrgLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth, fetchOrg])

  const signOut = async () => {
    await supabase.auth.signOut()
    setOrg(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, orgLoading, org, isAdmin: org?.role === "ADMIN", refreshOrg, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
