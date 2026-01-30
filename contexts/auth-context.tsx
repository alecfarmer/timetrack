"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { User, Session } from "@supabase/supabase-js"
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
  org: OrgInfo | null
  isAdmin: boolean
  refreshOrg: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  org: null,
  isAdmin: false,
  refreshOrg: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState<OrgInfo | null>(null)
  const supabase = createClient()

  const fetchOrg = useCallback(async (userId: string) => {
    const { data: membership } = await supabase
      .from("Membership")
      .select(`
        orgId,
        role,
        org:Organization (id, name, slug)
      `)
      .eq("userId", userId)
      .limit(1)
      .single()

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
  }, [supabase])

  const refreshOrg = useCallback(async () => {
    if (user) {
      await fetchOrg(user.id)
    }
  }, [user, fetchOrg])

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchOrg(session.user.id)
      }
      setLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchOrg(session.user.id)
      } else {
        setOrg(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, fetchOrg])

  const signOut = async () => {
    await supabase.auth.signOut()
    setOrg(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, org, isAdmin: org?.role === "ADMIN", refreshOrg, signOut }}>
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
