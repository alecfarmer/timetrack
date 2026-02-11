"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  Users,
  Clock,
  MapPin,
  Shield,
  ShieldCheck,
  Search,
  MoreHorizontal,
  Activity,
  Eye,
  Mail,
  UserX,
  Edit3,
  Download,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"
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

interface Policy {
  requiredDaysPerWeek: number
  minimumMinutesPerDay: number
}

export default function TeamPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [members, setMembers] = useState<Member[]>([])
  const [policy, setPolicy] = useState<Policy>({ requiredDaysPerWeek: 3, minimumMinutesPerDay: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all")
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "member">("all")

  const fetchData = useCallback(async () => {
    try {
      const [membersRes, policyRes] = await Promise.all([
        fetch("/api/org/members"),
        fetch("/api/org/policy"),
      ])

      if (membersRes.ok) setMembers(await membersRes.json())
      if (policyRes.ok) {
        const p = await policyRes.json()
        setPolicy(p)
      }
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

  const formatMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  // Filtered members
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading team...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="text-muted-foreground">
            {members.length} members &middot; {clockedInCount} online &middot; {adminCount} admins
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

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
                      {(member.email?.[0] || "U").toUpperCase()}
                    </div>
                    {member.isClockedIn && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background" />
                    )}
                  </div>

                  {/* Member info */}
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

                  {/* Compliance indicator */}
                  <div className="hidden sm:flex items-center gap-2">
                    {member.weekDaysWorked !== undefined && (
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {member.weekDaysWorked}/{policy.requiredDaysPerWeek}
                        </p>
                        <p className="text-xs text-muted-foreground">days this week</p>
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
                      <DropdownMenuItem onClick={() => router.push(`/admin/entries/${member.userId}`)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Entries
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleRole(member.id, member.role)}>
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
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Remove Member
                      </DropdownMenuItem>
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
  )
}
