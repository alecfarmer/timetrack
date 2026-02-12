"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenter } from "@/components/notification-center"
import { RefreshButton } from "@/components/pull-to-refresh"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  Clock,
  MapPin,
  Shield,
  ShieldCheck,
  Search,
  MoreHorizontal,
  Activity,
  Eye,
  Mail,
  User,
  Users,
  UserX,
  Edit3,
  Download,
  AlertCircle,
  UserPlus,
  Copy,
  Check,
  Link2,
  Trash2,
  Loader2,
  Send,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface Member {
  id: string
  userId: string
  email?: string | null
  firstName?: string | null
  lastName?: string | null
  displayName?: string | null
  role: string
  isOwner?: boolean
  createdAt: string
  isClockedIn?: boolean
  todayMinutes?: number
  todayLocation?: string | null
  weekDaysWorked?: number
  lastActivity?: string | null
}

interface Policy {
  requiredDaysPerWeek: number
  minimumMinutesPerDay: number
}

interface Invite {
  id: string
  code: string
  email: string | null
  role: string
  expiresAt: string
  createdAt: string
}

export default function TeamPage() {
  const { org, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [members, setMembers] = useState<Member[]>([])
  const [policy, setPolicy] = useState<Policy>({ requiredDaysPerWeek: 3, minimumMinutesPerDay: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Invite state
  const [invites, setInvites] = useState<Invite[]>([])
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"MEMBER" | "ADMIN">("MEMBER")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Edit name state
  const [editNameMember, setEditNameMember] = useState<Member | null>(null)
  const [editFirstName, setEditFirstName] = useState("")
  const [editLastName, setEditLastName] = useState("")
  const [editNameLoading, setEditNameLoading] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all")
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "member">("all")

  const fetchData = useCallback(async () => {
    try {
      const [membersRes, policyRes, invitesRes] = await Promise.all([
        fetch("/api/org/members"),
        fetch("/api/org/policy"),
        fetch("/api/org/invite"),
      ])

      if (membersRes.ok) setMembers(await membersRes.json())
      if (policyRes.ok) {
        const p = await policyRes.json()
        setPolicy(p)
      }
      if (invitesRes.ok) setInvites(await invitesRes.json())
    } catch (err) {
      console.error("Error fetching team data:", err)
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

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Remove this member from the organization? This action cannot be undone.")) return
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

  const handleExportCSV = async () => {
    try {
      const res = await fetch("/api/org/export")
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `team-export-${format(new Date(), "yyyy-MM-dd")}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError("Failed to export data")
    }
  }

  const handleCreateInvite = async () => {
    setInviteLoading(true)
    setGeneratedLink(null)
    try {
      const emails = inviteEmail
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e.length > 0)

      if (emails.length > 1) {
        const res = await fetch("/api/org/invite/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails, role: inviteRole, expiresInDays: 7 }),
        })
        if (!res.ok) throw new Error("Failed to create invites")
        const data = await res.json()
        if (data.results?.[0]?.invite?.code) {
          setGeneratedLink(`${window.location.origin}/signup?invite=${data.results[0].invite.code}`)
        }
      } else {
        const res = await fetch("/api/org/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emails[0] || undefined,
            role: inviteRole,
            expiresInDays: 7,
          }),
        })
        if (!res.ok) throw new Error("Failed to create invite")
        const invite = await res.json()
        setGeneratedLink(`${window.location.origin}/signup?invite=${invite.code}`)
      }

      const invitesRes = await fetch("/api/org/invite")
      if (invitesRes.ok) setInvites(await invitesRes.json())
      setInviteEmail("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite")
    } finally {
      setInviteLoading(false)
    }
  }

  const handleGenerateLink = async () => {
    setInviteLoading(true)
    try {
      const res = await fetch("/api/org/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: inviteRole, expiresInDays: 7 }),
      })
      if (!res.ok) throw new Error("Failed to generate link")
      const invite = await res.json()
      setGeneratedLink(`${window.location.origin}/signup?invite=${invite.code}`)
      const invitesRes = await fetch("/api/org/invite")
      if (invitesRes.ok) setInvites(await invitesRes.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate invite link")
    } finally {
      setInviteLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!generatedLink) return
    await navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRevokeInvite = async (id: string) => {
    try {
      const res = await fetch(`/api/org/invite?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to revoke invite")
      setInvites((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke invite")
    }
  }

  const handleEditName = (member: Member) => {
    setEditNameMember(member)
    setEditFirstName(member.firstName || "")
    setEditLastName(member.lastName || "")
  }

  const handleSaveName = async () => {
    if (!editNameMember) return
    setEditNameLoading(true)
    try {
      const res = await fetch("/api/org/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: editNameMember.id,
          firstName: editFirstName.trim(),
          lastName: editLastName.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update name")
      }
      setEditNameMember(null)
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update name")
    } finally {
      setEditNameLoading(false)
    }
  }

  const formatMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const pendingInvites = useMemo(() =>
    invites.filter((i) => new Date(i.expiresAt) > new Date()),
    [invites]
  )

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch = searchQuery === "" ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.userId.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "online" && member.isClockedIn) ||
        (statusFilter === "offline" && !member.isClockedIn)

      const matchesRole = roleFilter === "all" ||
        (roleFilter === "admin" && member.role === "ADMIN") ||
        (roleFilter === "member" && member.role === "MEMBER")

      return matchesSearch && matchesStatus && matchesRole
    })
  }, [members, searchQuery, statusFilter, roleFilter])

  const clockedInCount = useMemo(() =>
    members.filter((m) => m.isClockedIn).length,
    [members]
  )

  const adminCount = useMemo(() =>
    members.filter((m) => m.role === "ADMIN").length,
    [members]
  )

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
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Loading team...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Premium Dark Hero Header */}
      <div className="hidden lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent" />
        <div className="absolute inset-0 backdrop-blur-3xl" />

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
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Team Members</h1>
                {org && (
                  <p className="text-xs text-white/60">{org.orgName}</p>
                )}
              </div>
              {pendingInvites.length > 0 && (
                <Badge className="rounded-full bg-blue-500 text-white border-0">
                  {pendingInvites.length} pending
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="gap-2 text-white/70 hover:text-white hover:bg-white/10">
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Invite</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px]">
                  <DialogHeader>
                    <DialogTitle>Invite Team Members</DialogTitle>
                    <DialogDescription>
                      Send email invites or generate a shareable link for new members.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Addresses</label>
                      <Input
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@example.com (comma-separated for bulk)"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Role</label>
                      <Select value={inviteRole} onValueChange={(v: "MEMBER" | "ADMIN") => setInviteRole(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleCreateInvite}
                        disabled={inviteLoading || !inviteEmail.trim()}
                        className="flex-1 gap-2"
                      >
                        {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Send Invite
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleGenerateLink}
                        disabled={inviteLoading}
                        className="gap-2"
                      >
                        <Link2 className="h-4 w-4" />
                        Generate Link
                      </Button>
                    </div>

                    {generatedLink && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg bg-muted p-3 space-y-2"
                      >
                        <p className="text-xs font-medium text-muted-foreground">Invite Link</p>
                        <div className="flex gap-2">
                          <Input
                            value={generatedLink}
                            readOnly
                            className="text-xs font-mono"
                          />
                          <Button size="icon" variant="outline" onClick={handleCopyLink}>
                            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Expires in 7 days</p>
                      </motion.div>
                    )}

                    {pendingInvites.length > 0 && (
                      <div className="border-t pt-4 space-y-2">
                        <h4 className="text-sm font-medium">Pending Invites ({pendingInvites.length})</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {pendingInvites.map((invite) => (
                            <div key={invite.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">
                                  {invite.email || `Code: ${invite.code}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {invite.role} &middot; Expires {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleRevokeInvite(invite.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportCSV}
                className="gap-2 text-white/70 hover:text-white hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <RefreshButton onRefresh={handleRefresh} refreshing={refreshing} className="text-white/70 hover:text-white hover:bg-white/10" />
              <ThemeToggle />
              <NotificationCenter />
            </div>
          </div>
        </header>

        {/* Stats Cards in Hero */}
        <div className="relative z-10 px-4 pt-4 pb-6 max-w-6xl mx-auto lg:px-8">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{members.length}</p>
              <p className="text-xs text-white/60 mt-0.5">Total Members</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                <Activity className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white">{clockedInCount}</p>
              <p className="text-xs text-white/60 mt-0.5">Online Now</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="h-5 w-5 text-violet-400" />
              </div>
              <p className="text-2xl font-bold text-white">{adminCount}</p>
              <p className="text-xs text-white/60 mt-0.5">Admins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 lg:pb-8 pt-6">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-6">
          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive flex-1">{error}</p>
                <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                  Dismiss
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={(v: "all" | "online" | "offline") => setStatusFilter(v)}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={roleFilter} onValueChange={(v: "all" | "admin" | "member") => setRoleFilter(v)}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                      <SelectItem value="member">Members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team List */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <motion.div
                    key={member.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
                      {/* Status indicator */}
                      <div className="relative">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold",
                          member.isClockedIn
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {(member.displayName?.[0] || member.email?.[0] || "U").toUpperCase()}
                        </div>
                        {member.isClockedIn && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background" />
                        )}
                      </div>

                      {/* Member info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {member.displayName || member.email || `User ${member.userId.slice(0, 8)}`}
                          </p>
                          {member.isOwner && (
                            <Badge className="text-[10px] px-1.5 bg-amber-500 text-white border-0">
                              Owner
                            </Badge>
                          )}
                          <Badge
                            variant={member.role === "ADMIN" ? "default" : "secondary"}
                            className="text-[10px] px-1.5"
                          >
                            {member.role === "ADMIN" ? (
                              <><ShieldCheck className="h-3 w-3 mr-1" />Admin</>
                            ) : (
                              "Member"
                            )}
                          </Badge>
                        </div>
                        {member.displayName && member.email && (
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {member.isClockedIn ? (
                            <>
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <Activity className="h-3 w-3" />
                                On-site
                              </span>
                              {member.todayLocation && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {member.todayLocation}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">Offline</span>
                          )}
                          {member.todayMinutes !== undefined && member.todayMinutes > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatMinutes(member.todayMinutes)} today
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Compliance indicator */}
                      <div className="flex items-center gap-2">
                        {member.weekDaysWorked !== undefined && (
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {member.weekDaysWorked}/{policy.requiredDaysPerWeek}
                            </p>
                            <p className="text-xs text-muted-foreground hidden sm:block">days this week</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditName(member)}>
                            <User className="h-4 w-4 mr-2" />
                            Edit Name
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/admin/entries/${member.userId}`)}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit Entries
                          </DropdownMenuItem>
                          {!member.isOwner && (
                            <DropdownMenuItem onClick={() => handleToggleRole(member.id, member.role)}>
                              <Shield className="h-4 w-4 mr-2" />
                              {member.role === "ADMIN" ? "Demote to Member" : "Promote to Admin"}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Activity
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                          {!member.isOwner && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Remove Member
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">No members found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filters
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Edit Name Dialog */}
      <Dialog open={!!editNameMember} onOpenChange={(open) => !open && setEditNameMember(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Name</DialogTitle>
            <DialogDescription>
              Update the name for {editNameMember?.email || "this member"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditNameMember(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveName} disabled={editNameLoading}>
                {editNameLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
