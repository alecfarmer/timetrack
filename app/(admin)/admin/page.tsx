"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { AdminActivityFeed } from "@/components/admin-activity-feed"
import { NotificationCenter } from "@/components/notification-center"
import { RefreshButton } from "@/components/pull-to-refresh"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
  Sliders,
  BarChart3,
  Bell,
  ScrollText,
  ClipboardCheck,
  HeartPulse,
  Scale,
  DollarSign,
  CalendarClock,
  Edit3,
  Palmtree,
  TrendingUp,
  LogIn,
  LayoutDashboard,
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

interface AdminMetrics {
  totalMembers: number
  currentlyOnSite: number
  todayClockIns: number
  pendingTimesheets: number
  complianceRate: number
  weeklyCompliant: number
  weeklyTotal: number
}

export default function AdminPage() {
  const { org, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [policy, setPolicy] = useState<Policy>({ requiredDaysPerWeek: 3, minimumMinutesPerDay: 0 })
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [inviteEmail, setInviteEmail] = useState("")
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [editingPolicy, setEditingPolicy] = useState(false)
  const [policyDays, setPolicyDays] = useState(3)
  const [savingPolicy, setSavingPolicy] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [membersRes, invitesRes, policyRes, metricsRes] = await Promise.all([
        fetch("/api/org/members"),
        fetch("/api/org/invite"),
        fetch("/api/org/policy"),
        fetch("/api/admin/metrics"),
      ])

      if (membersRes.ok) setMembers(await membersRes.json())
      if (invitesRes.ok) setInvites(await invitesRes.json())
      if (policyRes.ok) {
        const p = await policyRes.json()
        setPolicy(p)
        setPolicyDays(p.requiredDaysPerWeek)
      }
      if (metricsRes.ok) setMetrics(await metricsRes.json())
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

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

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
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/20 animate-ping absolute inset-0" />
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="h-8 w-8 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Loading dashboard...</p>
        </motion.div>
      </div>
    )
  }

  const activeInvites = invites.filter((i) => !i.usedBy && new Date(i.expiresAt) > new Date())
  const clockedInCount = members.filter((m) => m.isClockedIn).length

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Premium Dark Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent" />
        <div className="absolute inset-0 backdrop-blur-3xl" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />

        <header className="relative z-10 safe-area-pt">
          <div className="flex items-center justify-between px-4 h-14 max-w-6xl mx-auto lg:px-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Admin Dashboard</h1>
                {org && (
                  <p className="text-xs text-white/60">{org.orgName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RefreshButton onRefresh={handleRefresh} refreshing={refreshing} className="text-white/70 hover:text-white hover:bg-white/10" />
              <ThemeToggle />
              <NotificationCenter />
            </div>
          </div>
        </header>

        {/* Stats Cards in Hero */}
        <div className="relative z-10 px-4 pt-4 pb-6 max-w-6xl mx-auto lg:px-8">
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-2">
                <Users className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{metrics?.totalMembers || members.length}</p>
              <p className="text-xs text-white/60">Members</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                <MapPin className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">{metrics?.currentlyOnSite || clockedInCount}</p>
              <p className="text-xs text-white/60">On-Site</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                <LogIn className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-400">{metrics?.todayClockIns || 0}</p>
              <p className="text-xs text-white/60">Clock-ins</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center relative">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
                <ClipboardCheck className="h-5 w-5 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-amber-400">{metrics?.pendingTimesheets || 0}</p>
              <p className="text-xs text-white/60">Pending</p>
              {(metrics?.pendingTimesheets || 0) > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">{metrics?.complianceRate || 100}%</p>
              <p className="text-xs text-white/60">Compliance</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center mx-auto mb-2">
                <UserPlus className="h-5 w-5 text-violet-400" />
              </div>
              <p className="text-2xl font-bold text-violet-400">{activeInvites.length}</p>
              <p className="text-xs text-white/60">Invites</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 lg:pb-8 -mt-4">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive flex-1">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>Dismiss</Button>
            </motion.div>
          )}

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3"
          >
            {[
              { href: "/admin/features", icon: Sliders, label: "Features", color: "text-violet-500 bg-violet-500/10" },
              { href: "/admin/analytics", icon: BarChart3, label: "Analytics", color: "text-blue-500 bg-blue-500/10" },
              { href: "/admin/timesheets", icon: ClipboardCheck, label: "Timesheets", color: "text-emerald-500 bg-emerald-500/10" },
              { href: "/admin/audit", icon: ScrollText, label: "Audit Log", color: "text-amber-500 bg-amber-500/10" },
              { href: "/admin/wellbeing", icon: HeartPulse, label: "Well-Being", color: "text-rose-500 bg-rose-500/10" },
              { href: "/admin/jurisdictions", icon: Scale, label: "Jurisdictions", color: "text-cyan-500 bg-cyan-500/10" },
              { href: "/admin/payroll-config", icon: DollarSign, label: "Payroll", color: "text-green-500 bg-green-500/10" },
              { href: "/admin/shifts", icon: CalendarClock, label: "Shifts", color: "text-indigo-500 bg-indigo-500/10" },
              { href: "/admin/bulk-edit", icon: Edit3, label: "Bulk Edit", color: "text-pink-500 bg-pink-500/10" },
              { href: "/admin/leave-policy", icon: Palmtree, label: "Leave", color: "text-teal-500 bg-teal-500/10" },
              { href: "/admin/alerts", icon: Bell, label: "Alerts", color: "text-orange-500 bg-orange-500/10" },
              { href: "/admin/settings", icon: Settings, label: "Settings", color: "text-slate-500 bg-slate-500/10" },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group rounded-2xl">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color.split(' ')[1]}`}>
                      <item.icon className={`h-4.5 w-4.5 ${item.color.split(' ')[0]}`} />
                    </div>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{item.label}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </motion.div>

          {/* Activity Feed - Full width on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:hidden"
          >
            <AdminActivityFeed limit={10} />
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Members List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Team Members</h2>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={handleExportCSV}>
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
              </div>
              <div className="space-y-3">
                {members.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card className="border-0 shadow-lg rounded-2xl">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              member.isClockedIn ? "bg-emerald-500/10" : "bg-muted"
                            }`}>
                              <div className={`w-3 h-3 rounded-full ${
                                member.isClockedIn ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"
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
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              {/* Activity Feed - Desktop only */}
              <div className="hidden lg:block">
                <AdminActivityFeed limit={10} />
              </div>

              {/* Invite Section */}
              <Card className="border-0 shadow-lg rounded-2xl">
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
                        <div key={invite.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-xl">
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
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
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
              <Card className="border-0 shadow-lg rounded-2xl">
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
      </main>
    </motion.div>
  )
}
