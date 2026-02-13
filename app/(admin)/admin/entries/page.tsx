"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenter } from "@/components/notification-center"
import { RefreshButton } from "@/components/pull-to-refresh"
import { useAuth } from "@/contexts/auth-context"
import {
  Users,
  Search,
  Clock,
  ChevronRight,
  Activity,
  Edit3,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Member {
  id: string
  userId: string
  email?: string | null
  displayName?: string | null
  role: string
  isClockedIn?: boolean
  todayMinutes?: number
}

export default function EntriesIndexPage() {
  const { org, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/org/members")
      if (res.ok) {
        setMembers(await res.json())
      }
    } catch (err) {
      console.error("Error fetching members:", err)
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
      fetchMembers()
    }
  }, [authLoading, isAdmin, router, fetchMembers])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchMembers()
    setRefreshing(false)
  }

  const filteredMembers = useMemo(() =>
    members.filter(member =>
      searchQuery === "" ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.userId.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [members, searchQuery]
  )

  const clockedInCount = useMemo(() =>
    members.filter((m) => m.isClockedIn).length,
    [members]
  )

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
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
          <p className="text-muted-foreground font-medium">Loading entries...</p>
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent" />

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
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                <Edit3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Edit Entries</h1>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{members.length}</p>
              <p className="text-xs text-white/60 mt-0.5">Team Members</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                <Activity className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white">{clockedInCount}</p>
              <p className="text-xs text-white/60 mt-0.5">Online Now</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 lg:pb-8 pt-6">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Select an employee to view and edit their time entries
          </p>

          {/* Employee List */}
          <div className="grid gap-3">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <Card
                  key={member.id}
                  className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                  onClick={() => router.push(`/admin/entries/${member.userId}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
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
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {member.displayName || member.email || `User ${member.userId.slice(0, 8)}`}
                          </p>
                          <Badge variant={member.role === "ADMIN" ? "default" : "secondary"} className="text-[10px]">
                            {member.role}
                          </Badge>
                        </div>
                        {member.displayName && member.email && (
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {member.isClockedIn ? (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <Activity className="h-3 w-3" />
                              Currently on-site
                            </span>
                          ) : (
                            <span>Offline</span>
                          )}
                          {member.todayMinutes !== undefined && member.todayMinutes > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatMinutes(member.todayMinutes)} today
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">No employees found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Try a different search term" : "No team members in your organization"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </motion.div>
  )
}
