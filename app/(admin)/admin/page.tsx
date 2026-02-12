"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { AdminActivityFeed } from "@/components/admin-activity-feed"
import { NotificationCenter } from "@/components/notification-center"
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
  AlertCircle,
  Download,
  ClipboardCheck,
  Edit3,
  TrendingUp,
  LogIn,
  LayoutDashboard,
  Search,
  MoreHorizontal,
  RefreshCw,
  Activity,
  Zap,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  UserX,
  Mail,
  Loader2,
  Scale,
  CheckCircle2,
  Coffee,
  Target,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

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

// --- Metric ring mini chart ---
function MetricRing({ value, max, color, size = 40 }: { value: number; max: number; color: string; size?: number }) {
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(100, (value / Math.max(max, 1)) * 100)
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" strokeWidth={3}
        className="stroke-muted"
      />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" strokeWidth={3} strokeLinecap="round"
        className={color}
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  )
}

// --- Team member row ---
function MemberRow({
  member,
  policy,
  onToggleRole,
  onRemove,
  formatMinutes,
  onEditEntries,
}: {
  member: Member
  policy: Policy
  onToggleRole: () => void
  onRemove: () => void
  formatMinutes: (mins: number) => string
  onEditEntries: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
        <div className="relative">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold",
            member.isClockedIn
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          )}>
            {(member.email?.[0] || "U").toUpperCase()}
          </div>
          {member.isClockedIn && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">
              {member.email || `User ${member.userId.slice(0, 8)}`}
            </p>
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

        <div className="hidden sm:flex items-center gap-3">
          {member.weekDaysWorked !== undefined && (
            <div className="flex items-center gap-2">
              <MetricRing
                value={member.weekDaysWorked}
                max={policy.requiredDaysPerWeek}
                color={member.weekDaysWorked >= policy.requiredDaysPerWeek ? "stroke-emerald-500" : "stroke-primary"}
                size={32}
              />
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">
                  {member.weekDaysWorked}/{policy.requiredDaysPerWeek}
                </p>
                <p className="text-[10px] text-muted-foreground">days</p>
              </div>
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onEditEntries}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Entries
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleRole}>
              <Shield className="h-4 w-4 mr-2" />
              {member.role === "ADMIN" ? "Demote to Member" : "Promote to Admin"}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Eye className="h-4 w-4 mr-2" />
              View Activity
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Mail className="h-4 w-4 mr-2" />
              Send Message
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onRemove}
            >
              <UserX className="h-4 w-4 mr-2" />
              Remove Member
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  )
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

  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all")
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "member">("all")

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"MEMBER" | "ADMIN">("MEMBER")
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
      setError("Failed to load dashboard data")
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

  useEffect(() => {
    if (!authLoading && isAdmin) {
      const interval = setInterval(fetchData, 30000)
      return () => clearInterval(interval)
    }
  }, [authLoading, isAdmin, fetchData])

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
          role: inviteRole,
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

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
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
      a.download = `team-export-${format(new Date(), "yyyy-MM-dd")}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError("Failed to export data")
    }
  }

  const formatMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch = searchQuery === "" ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const activeInvites = useMemo(() =>
    invites.filter((i) => !i.usedBy && new Date(i.expiresAt) > new Date()),
    [invites]
  )

  const clockedInCount = useMemo(() =>
    members.filter((m) => m.isClockedIn).length,
    [members]
  )

  const adminCount = useMemo(() =>
    members.filter((m) => m.role === "ADMIN").length,
    [members]
  )

  const onSitePercent = Math.round((clockedInCount / Math.max(members.length, 1)) * 100)

  // Total team hours today
  const totalTeamMinutesToday = useMemo(() =>
    members.reduce((sum, m) => sum + (m.todayMinutes || 0), 0),
    [members]
  )

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="hidden lg:block sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <LayoutDashboard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Dashboard</h1>
                {org && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {org.orgName}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs gap-1.5 px-2.5 py-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {clockedInCount} on-site
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-8 w-8"
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
              <NotificationCenter />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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

        {/* ──────── Hero Metrics ──────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* On-site now — hero stat */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-emerald-500/0">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">On-Site Now</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-4xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                        {metrics?.currentlyOnSite || clockedInCount}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / {metrics?.totalMembers || members.length}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{onSitePercent}% of team</p>
                  </div>
                  <div className="relative">
                    <MetricRing
                      value={clockedInCount}
                      max={members.length}
                      color="stroke-emerald-500"
                      size={52}
                    />
                    <MapPin className="h-4 w-4 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Today's arrivals */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="relative overflow-hidden border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/0">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Today&apos;s Arrivals</p>
                    <p className="text-4xl font-bold tracking-tight mt-1 text-blue-600 dark:text-blue-400">
                      {metrics?.todayClockIns || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatMinutes(totalTeamMinutesToday)} team total
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <LogIn className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Compliance */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className={cn(
              "relative overflow-hidden",
              metrics?.complianceRate && metrics.complianceRate >= 90
                ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-emerald-500/0"
                : "border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-amber-500/0"
            )}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Compliance</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className={cn(
                        "text-4xl font-bold tracking-tight",
                        metrics?.complianceRate && metrics.complianceRate >= 90
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      )}>
                        {metrics?.complianceRate || 100}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {metrics?.complianceRate && metrics.complianceRate >= 90 ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <ArrowUpRight className="h-3 w-3" />
                          On track
                        </span>
                      ) : (
                        <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                          <ArrowDownRight className="h-3 w-3" />
                          Needs attention
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <MetricRing
                      value={metrics?.weeklyCompliant || 0}
                      max={metrics?.weeklyTotal || 1}
                      color={metrics?.complianceRate && metrics.complianceRate >= 90 ? "stroke-emerald-500" : "stroke-amber-500"}
                      size={52}
                    />
                    <Target className="h-4 w-4 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pending timesheets */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className={cn(
              "relative overflow-hidden",
              metrics?.pendingTimesheets && metrics.pendingTimesheets > 0
                ? "border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-violet-500/0"
                : ""
            )}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Timesheets</p>
                    <p className={cn(
                      "text-4xl font-bold tracking-tight mt-1",
                      metrics?.pendingTimesheets && metrics.pendingTimesheets > 0
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-muted-foreground"
                    )}>
                      {metrics?.pendingTimesheets || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {metrics?.pendingTimesheets && metrics.pendingTimesheets > 0 ? (
                        <Link href="/admin/timesheets" className="text-violet-600 dark:text-violet-400 hover:underline">
                          Review pending
                        </Link>
                      ) : (
                        "All caught up"
                      )}
                    </p>
                  </div>
                  <div className={cn(
                    "p-3 rounded-xl",
                    metrics?.pendingTimesheets && metrics.pendingTimesheets > 0
                      ? "bg-violet-500/10"
                      : "bg-muted"
                  )}>
                    <ClipboardCheck className={cn(
                      "h-5 w-5",
                      metrics?.pendingTimesheets && metrics.pendingTimesheets > 0
                        ? "text-violet-500"
                        : "text-muted-foreground"
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ──────── Tabs ──────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full sm:w-auto sm:inline-grid grid-cols-3 bg-muted/50">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Team</span>
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {members.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="invites" className="gap-2">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Invites</span>
              {activeInvites.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {activeInvites.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ──────── Overview Tab ──────── */}
          <TabsContent value="overview" className="space-y-6">
            {/* Team at a Glance — avatar grid */}
            {members.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Team Status
                      </CardTitle>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          On-site ({clockedInCount})
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                          Offline ({members.length - clockedInCount})
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {members
                        .sort((a, b) => (b.isClockedIn ? 1 : 0) - (a.isClockedIn ? 1 : 0))
                        .map((member, i) => (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="group relative"
                        >
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold transition-all cursor-default",
                              member.isClockedIn
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/30"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {(member.email?.[0] || "U").toUpperCase()}
                          </div>
                          {member.isClockedIn && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
                          )}
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-popover border shadow-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <p className="font-medium">{member.email || `User ${member.userId.slice(0, 6)}`}</p>
                            {member.isClockedIn ? (
                              <p className="text-emerald-500">
                                {member.todayLocation || "On-site"} &middot; {formatMinutes(member.todayMinutes || 0)}
                              </p>
                            ) : (
                              <p className="text-muted-foreground">Offline</p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Activity Feed */}
              <div className="lg:col-span-2">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <Activity className="h-4 w-4 text-primary" />
                          Live Activity
                        </CardTitle>
                        <Badge variant="outline" className="text-xs gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Live
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <AdminActivityFeed limit={10} />
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Today's Breakdown */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        Today&apos;s Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Team hours */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Team hours</span>
                          <span className="font-semibold tabular-nums">
                            {formatMinutes(totalTeamMinutesToday)}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(100, (totalTeamMinutesToday / (members.length * 480)) * 100)}
                          className="h-1.5"
                        />
                      </div>

                      {/* Breakdown stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                          <div className="flex items-center gap-1.5 mb-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-xs text-muted-foreground">Active</span>
                          </div>
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {members.filter(m => m.isClockedIn && !m.todayLocation?.includes("Break")).length}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Coffee className="h-3.5 w-3.5 text-amber-500" />
                            <span className="text-xs text-muted-foreground">On Break</span>
                          </div>
                          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                            {members.filter(m => m.todayLocation?.includes("Break")).length}
                          </p>
                        </div>
                      </div>

                      {/* Top workers */}
                      {members.filter(m => (m.todayMinutes || 0) > 0).length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Top hours today</p>
                          <div className="space-y-2">
                            {members
                              .filter(m => (m.todayMinutes || 0) > 0)
                              .sort((a, b) => (b.todayMinutes || 0) - (a.todayMinutes || 0))
                              .slice(0, 3)
                              .map((m, i) => (
                                <div key={m.id} className="flex items-center gap-2.5">
                                  <span className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                                    i === 0 ? "bg-amber-500/15 text-amber-600" :
                                    i === 1 ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300" :
                                    "bg-orange-500/10 text-orange-600"
                                  )}>
                                    {i + 1}
                                  </span>
                                  <span className="text-sm truncate flex-1">
                                    {m.email?.split("@")[0] || `User ${m.userId.slice(0, 6)}`}
                                  </span>
                                  <span className="text-sm font-medium tabular-nums">
                                    {formatMinutes(m.todayMinutes || 0)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Policy Card */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Scale className="h-4 w-4 text-primary" />
                        Work Policy
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                        <div className="relative">
                          <MetricRing
                            value={policy.requiredDaysPerWeek}
                            max={5}
                            color="stroke-primary"
                            size={44}
                          />
                          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold">
                            {policy.requiredDaysPerWeek}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {policy.requiredDaysPerWeek} days per week
                          </p>
                          <p className="text-xs text-muted-foreground">
                            8 hours minimum per day
                          </p>
                        </div>
                      </div>

                      {editingPolicy ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              max={7}
                              value={policyDays}
                              onChange={(e) => setPolicyDays(parseInt(e.target.value) || 0)}
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">days per week</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSavePolicy}
                              disabled={savingPolicy}
                              className="flex-1"
                            >
                              {savingPolicy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setEditingPolicy(false); setPolicyDays(policy.requiredDaysPerWeek) }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setEditingPolicy(true)}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Policy
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </TabsContent>

          {/* ──────── Team Tab ──────── */}
          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search team members..."
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
                    <Button variant="outline" onClick={handleExportCSV} className="gap-2">
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      policy={policy}
                      onToggleRole={() => handleToggleRole(member.id, member.role)}
                      onRemove={() => handleRemoveMember(member.id)}
                      formatMinutes={formatMinutes}
                      onEditEntries={() => router.push(`/admin/entries/${member.userId}`)}
                    />
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
          </TabsContent>

          {/* ──────── Invites Tab ──────── */}
          <TabsContent value="invites" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" />
                    Create Invite
                  </CardTitle>
                  <CardDescription>
                    Generate an invite code to add new team members
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inviteEmail">Email (optional)</Label>
                    <Input
                      id="inviteEmail"
                      type="email"
                      placeholder="teammate@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty for a general invite code
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={inviteRole} onValueChange={(v: "MEMBER" | "ADMIN") => setInviteRole(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Member
                          </div>
                        </SelectItem>
                        <SelectItem value="ADMIN">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            Admin
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={handleCreateInvite}
                    disabled={creatingInvite}
                  >
                    {creatingInvite ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    Generate Invite Code
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Active Invites
                    {activeInvites.length > 0 && (
                      <Badge variant="secondary">{activeInvites.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeInvites.length > 0 ? (
                    <div className="space-y-3">
                      {activeInvites.map((invite) => (
                        <div
                          key={invite.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <code className="font-mono font-bold text-sm bg-muted px-2 py-0.5 rounded">
                                {invite.code}
                              </code>
                              <Badge variant={invite.role === "ADMIN" ? "default" : "secondary"} className="text-[10px]">
                                {invite.role}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              {invite.email && (
                                <span className="truncate">{invite.email}</span>
                              )}
                              <span>Expires {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleCopyCode(invite.code)}
                            >
                              {copiedCode === invite.code ? (
                                <Check className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleRevokeInvite(invite.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                        <Mail className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No active invites
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
