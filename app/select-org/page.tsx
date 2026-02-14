"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import {
  Building2,
  ChevronRight,
  Loader2,
  Check,
  X,
  Link as LinkIcon,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"

interface OrgItem {
  orgId: string
  orgName: string
  orgSlug: string
  role: string
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50)
}

export default function SelectOrgPage() {
  const router = useRouter()
  const { user, loading: authLoading, refreshOrg } = useAuth()
  const supabase = createClient()
  const [orgs, setOrgs] = useState<OrgItem[]>([])
  const [loading, setLoading] = useState(true)
  const [metadataChecked, setMetadataChecked] = useState(false)

  // Org creation state
  const [showCreate, setShowCreate] = useState(false)
  const [orgName, setOrgName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle")
  const [slugError, setSlugError] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Join org state
  const [showJoin, setShowJoin] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [joining, setJoining] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchOrgs = useCallback(async () => {
    try {
      const res = await fetch("/api/org/my-orgs")
      if (res.ok) {
        const data = await res.json()
        setOrgs(data.orgs || [])

        // Auto-redirect if exactly one org
        if (data.orgs?.length === 1) {
          const org = data.orgs[0]
          await refreshOrg()
          router.replace(`/${org.orgSlug}/dashboard`)
          return
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [router, refreshOrg])

  useEffect(() => {
    if (!authLoading && user) {
      fetchOrgs()
    } else if (!authLoading && !user) {
      router.replace("/login")
    }
  }, [authLoading, user, fetchOrgs, router])

  // Check signup metadata for org_intent (auto-fill form from signup flow)
  useEffect(() => {
    if (metadataChecked || loading || orgs.length > 0) return
    async function checkMetadata() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const meta = authUser?.user_metadata
      if (meta?.org_intent === "create" && meta?.org_name) {
        setOrgName(meta.org_name)
        if (meta.org_slug) {
          setSlug(meta.org_slug)
          setSlugManuallyEdited(true)
        }
        setShowCreate(true)
      } else if (meta?.org_intent === "join" && meta?.invite_code) {
        setInviteCode(meta.invite_code)
        setShowJoin(true)
      }
      setMetadataChecked(true)

      // Clean up metadata
      if (meta?.org_intent) {
        await supabase.auth.updateUser({
          data: { org_intent: null, org_name: null, org_slug: null, invite_code: null }
        })
      }
    }
    checkMetadata()
  }, [metadataChecked, loading, orgs.length, supabase])

  // Auto-generate slug from org name
  useEffect(() => {
    if (!slugManuallyEdited && orgName) {
      setSlug(slugify(orgName))
    }
  }, [orgName, slugManuallyEdited])

  // Debounced slug availability check
  useEffect(() => {
    if (!slug || slug.length < 2) {
      setSlugStatus("idle")
      return
    }

    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) {
      setSlugStatus("invalid")
      setSlugError("Use lowercase letters, numbers, and hyphens only")
      return
    }

    setSlugStatus("checking")
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/org/check-slug?slug=${encodeURIComponent(slug)}`)
        const data = await res.json()
        if (data.available) {
          setSlugStatus("available")
          setSlugError("")
        } else {
          setSlugStatus("taken")
          setSlugError(data.reason || "Not available")
        }
      } catch {
        setSlugStatus("idle")
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [slug])

  const handleCreateOrg = async () => {
    if (!orgName.trim() || slugStatus !== "available") return

    setCreating(true)
    setError(null)

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName: orgName.trim(), slug }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create organization")
      }

      const data = await res.json()
      await refreshOrg()
      router.push(`/${data.orgSlug || slug}/dashboard`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setCreating(false)
    }
  }

  const handleJoinOrg = async () => {
    if (!inviteCode.trim()) return

    setJoining(true)
    setError(null)

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to join organization")
      }

      const data = await res.json()
      await refreshOrg()
      router.push(`/${data.orgSlug}/dashboard`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setJoining(false)
    }
  }

  const handleSelectOrg = async (org: OrgItem) => {
    await refreshOrg()
    router.push(`/${org.orgSlug}/dashboard`)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <Logo size="md" />
        </div>

        {/* Multiple orgs */}
        {orgs.length > 1 && !showCreate && !showJoin && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-1">Select Organization</h1>
              <p className="text-muted-foreground text-sm">Choose which organization to open</p>
            </div>

            <div className="space-y-2">
              {orgs.map((org) => (
                <button
                  key={org.orgId}
                  onClick={() => handleSelectOrg(org)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border hover:border-primary/30 hover:bg-muted/50 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{org.orgName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {org.role === "ADMIN" ? (
                        <>
                          <ShieldCheck className="h-3 w-3" />
                          Admin
                        </>
                      ) : (
                        <>
                          <Users className="h-3 w-3" />
                          Member
                        </>
                      )}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Zero orgs — show create/join options */}
        {orgs.length === 0 && !showCreate && !showJoin && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-1">Get Started</h1>
              <p className="text-muted-foreground text-sm">Create a new organization or join an existing one</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setShowCreate(true); setShowJoin(false) }}
                className="p-6 rounded-xl border-2 border-border hover:border-primary/30 text-center transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <p className="font-medium text-sm">Create New</p>
                <p className="text-xs text-muted-foreground mt-0.5">Start fresh</p>
              </button>
              <button
                onClick={() => { setShowJoin(true); setShowCreate(false) }}
                className="p-6 rounded-xl border-2 border-border hover:border-primary/30 text-center transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <LinkIcon className="h-6 w-6 text-primary" />
                </div>
                <p className="font-medium text-sm">Join Team</p>
                <p className="text-xs text-muted-foreground mt-0.5">Have a code?</p>
              </button>
            </div>
          </div>
        )}

        {/* Create org form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-1">Create Organization</h1>
                <p className="text-muted-foreground text-sm">Set up your team workspace</p>
              </div>

              {error && (
                <div className="rounded-xl p-4 border border-destructive/20 bg-destructive/5 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="orgName" className="text-sm font-medium">Organization name</Label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="orgName"
                    placeholder="e.g., Acme Corp"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="pl-11 h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-sm font-medium">URL slug</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">
                    app.usekpr.com/
                  </span>
                  <Input
                    id="slug"
                    placeholder="your-company"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                      setSlugManuallyEdited(true)
                    }}
                    className="pl-[120px] pr-10 h-12 rounded-xl font-mono text-sm"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {slugStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {slugStatus === "available" && <Check className="h-4 w-4 text-emerald-500" />}
                    {(slugStatus === "taken" || slugStatus === "invalid") && <X className="h-4 w-4 text-destructive" />}
                  </div>
                </div>
                {slugError && (
                  <p className="text-xs text-destructive">{slugError}</p>
                )}
                {slugStatus === "available" && (
                  <p className="text-xs text-emerald-600">This slug is available!</p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  className="h-12 rounded-xl"
                  onClick={() => { setShowCreate(false); setError(null) }}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl gap-2 font-medium"
                  onClick={handleCreateOrg}
                  disabled={creating || !orgName.trim() || slugStatus !== "available"}
                >
                  {creating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Create Organization
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Join org form */}
        <AnimatePresence>
          {showJoin && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-1">Join Organization</h1>
                <p className="text-muted-foreground text-sm">Enter your invite code</p>
              </div>

              {error && (
                <div className="rounded-xl p-4 border border-destructive/20 bg-destructive/5 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="inviteCode" className="text-sm font-medium">Invite code</Label>
                <Input
                  id="inviteCode"
                  placeholder="e.g., AB3K7NXQ"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="h-12 rounded-xl font-mono tracking-wider text-center text-lg"
                  maxLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Ask your admin for the 8-character invite code.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  className="h-12 rounded-xl"
                  onClick={() => { setShowJoin(false); setError(null) }}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl gap-2 font-medium"
                  onClick={handleJoinOrg}
                  disabled={joining || !inviteCode.trim()}
                >
                  {joining ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Join Organization
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
