"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/bottom-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  Users,
  UserPlus,
  Copy,
  Check,
  Clock,
  MapPin,
  Shield,
  ShieldCheck,
  Trash2,
  Settings,
  AlertCircle,
  Download,
} from "lucide-react"
import { format } from "date-fns"

interface Member {
  id: string
  userId: string
  email?: string | null
  role: string
  createdAt: string
  isClockedIn?: boolean
  todayMinutes?: number
  todayLocation?: string | null
  weekDaysWorked?: number
  lastActivity?: string | null
}

interface Invite {
  id: string
  code: string
  email: string | null
  role: string
  usedBy: string | null
  expiresAt: string
  createdAt: string
}

interface Policy {
  requiredDaysPerWeek: number
  minimumMinutesPerDay: number
}

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function AdminPage() {
  const { org, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [policy, setPolicy] = useState<Policy>({ requiredDaysPerWeek: 3, minimumMinutesPerDay: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [inviteEmail, setInviteEmail] = useState("")
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [editingPolicy, setEditingPolicy] = useState(false)
  const [policyDays, setPolicyDays] = useState(3)
  const [savingPolicy, setSavingPolicy] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [membersRes, invitesRes, policyRes] = await Promise.all([
        fetch("/api/org/members"),
        fetch("/api/org/invite"),
        fetch("/api/org/policy"),
      ])

      if (membersRes.ok) setMembers(await membersRes.json())
      if (invitesRes.ok) setInvites(await invitesRes.json())
      if (policyRes.ok) {
        const p = await policyRes.json()
        setPolicy(p)
        setPolicyDays(p.requiredDaysPerWeek)
      }
    } catch (err) {
      console.error("Error fetching admin data:", err)
      setError("Failed to load team data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/")
      return
    }
    if (!authLoading && isAdmin) {
      fetchData()
    }
  }, [authLoading, isAdmin, router, fetchData])

  const handleCreateInvite = async () => {
    setCreatingInvite(true)
    setError(null)
    try {
      const res = await fetch("/api/org/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim() || undefined,
          role: "MEMBER",
          expiresInDays: 7,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create invite")
      }
      setInviteEmail("")
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite")
    } finally {
      setCreatingInvite(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleRevokeInvite = async (id: string) => {
    try {
      await fetch(`/api/org/invite?id=${id}`, { method: "DELETE" })
      await fetchData()
    } catch {
      setError("Failed to revoke invite")
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Remove this member from the organization?")) return
    try {
      const res = await fetch(`/api/org/members?id=${memberId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to remove member")
      }
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member")
    }
  }

  const handleToggleRole = async (memberId: string, currentRole: string) => {
    const newRole = currentRole === "ADMIN" ? "MEMBER" : "ADMIN"
    try {
      const res = await fetch("/api/org/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role: newRole }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update role")
      }
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role")
    }
  }

  const handleSavePolicy = async () => {
    setSavingPolicy(true)
    try {
      const res = await fetch("/api/org/policy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requiredDaysPerWeek: policyDays }),
      })
      if (!res.ok) throw new Error("Failed to save policy")
      setEditingPolicy(false)
      await fetchData()
    } catch {
      setError("Failed to save policy")
    } finally {
      setSavingPolicy(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const res = await fetch("/api/org/export")
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `compliance-export-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError("Failed to export compliance data")
    }
  }

  const formatMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground font-medium">Loading team...</p>
        </div>
      </div>
    )
  }

  const activeInvites = invites.filter((i) => !i.usedBy && new Date(i.expiresAt) > new Date())
  const clockedInCount = members.filter((m) => m.isClockedIn).length

  return (
    <motion.div className="flex flex-col min-h-screen bg-background" initial="initial" animate="animate" variants={pageVariants}>
      <header className="sticky top-0 z-50 glass border-b lg:ml-64">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold">Team</h1>
          </div>
          <h1 className="hidden lg:block text-xl font-semibold">Team Dashboard</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {org && (
              <Badge variant="outline" className="hidden sm:flex gap-1">
                <ShieldCheck className="h-3 w-3" />
                {org.orgName}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <motion.main className="flex-1 pb-24 lg:pb-8 lg:ml-64" variants={staggerContainer} initial="initial" animate="animate">
        <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive flex-1">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>Dismiss</Button>
            </div>
          )}

          {/* Stats Row */}
          <motion.div variants={staggerItem} className="grid grid-cols-3 gap-4">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{members.length}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-success">{clockedInCount}</p>
                <p className="text-xs text-muted-foreground">Clocked In</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{activeInvites.length}</p>
                <p className="text-xs text-muted-foreground">Pending Invites</p>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Members List */}
            <motion.div variants={staggerItem} className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Team Members</h2>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={handleExportCSV}>
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
              </div>
              <div className="space-y-3">
                {members.map((member) => (
                  <Card key={member.id} className="border-0 shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            member.isClockedIn ? "bg-success/10" : "bg-muted"
                          }`}>
                            <div className={`w-3 h-3 rounded-full ${
                              member.isClockedIn ? "bg-success animate-pulse" : "bg-muted-foreground/30"
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{member.email || `${member.userId.slice(0, 8)}...`}</p>
                              <Badge variant={member.role === "ADMIN" ? "default" : "secondary"} className="text-[10px]">
                                {member.role}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {member.isClockedIn && member.todayLocation && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {member.todayLocation}
                                </span>
                              )}
                              {member.todayMinutes !== undefined && member.todayMinutes > 0 && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatMinutes(member.todayMinutes)} today
                                </span>
                              )}
                              {member.weekDaysWorked !== undefined && (
                                <span>{member.weekDaysWorked}/{policy.requiredDaysPerWeek} days</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleRole(member.id, member.role)}
                            title={member.role === "ADMIN" ? "Demote to member" : "Promote to admin"}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveMember(member.id)}
                            title="Remove member"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* Right sidebar */}
            <motion.div variants={staggerItem} className="space-y-6">
              {/* Invite Section */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Invite Members
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="inviteEmail" className="text-xs">Email (optional)</Label>
                    <Input
                      id="inviteEmail"
                      placeholder="team@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <Button
                    className="w-full rounded-xl gap-2"
                    onClick={handleCreateInvite}
                    disabled={creatingInvite}
                  >
                    <UserPlus className="h-4 w-4" />
                    {creatingInvite ? "Creating..." : "Generate Invite Code"}
                  </Button>

                  {activeInvites.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label className="text-xs text-muted-foreground">Active Invites</Label>
                      {activeInvites.map((invite) => (
                        <div key={invite.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-mono font-bold text-sm">{invite.code}</p>
                            {invite.email && (
                              <p className="text-[10px] text-muted-foreground">{invite.email}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground">
                              Expires {format(new Date(invite.expiresAt), "MMM d")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleCopyCode(invite.code)}
                            >
                              {copiedCode === invite.code ? (
                                <Check className="h-3.5 w-3.5 text-success" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleRevokeInvite(invite.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Policy Card */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Work Policy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {editingPolicy ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Required In-Office Days / Week</Label>
                        <Input
                          type="number"
                          min={0}
                          max={7}
                          value={policyDays}
                          onChange={(e) => setPolicyDays(parseInt(e.target.value) || 0)}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 rounded-xl"
                          onClick={handleSavePolicy}
                          disabled={savingPolicy}
                        >
                          {savingPolicy ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => { setEditingPolicy(false); setPolicyDays(policy.requiredDaysPerWeek) }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                        <div>
                          <p className="text-xs text-muted-foreground">Required Days</p>
                          <p className="font-semibold">{policy.requiredDaysPerWeek} days / week</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full rounded-xl"
                        onClick={() => setEditingPolicy(true)}
                      >
                        Edit Policy
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.main>

      <BottomNav currentPath="/admin" />
    </motion.div>
  )
}
