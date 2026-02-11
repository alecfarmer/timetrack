"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenter } from "@/components/notification-center"
import { RefreshButton } from "@/components/pull-to-refresh"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  HeartPulse,
  AlertTriangle,
  Coffee,
  Clock,
  TrendingUp,
  AlertCircle,
  Users,
} from "lucide-react"

interface MemberWellbeing {
  email: string
  burnoutScore: number
  consecutiveDays: number
  overtimeMinutes: number
  breakSkips: number
  avgDailyMinutes: number
}

interface WellbeingData {
  teamHealthScore: number
  membersAtRisk: number
  avgDailyHours: number
  breakSkipRate: number
  members: MemberWellbeing[]
}

function getBurnoutColor(score: number): string {
  if (score >= 75) return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30"
  if (score >= 50) return "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30"
  if (score >= 25) return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30"
  return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
}

function getBurnoutLabel(score: number): string {
  if (score >= 75) return "Critical"
  if (score >= 50) return "High"
  if (score >= 25) return "Moderate"
  return "Low"
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl animate-pulse">
      <div className="space-y-2 flex-1">
        <div className="h-4 w-40 bg-muted rounded" />
        <div className="h-3 w-24 bg-muted rounded" />
      </div>
      <div className="h-6 w-16 bg-muted rounded-full" />
    </div>
  )
}

export default function WellbeingPage() {
  const { org, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<WellbeingData | null>(null)
  const [period, setPeriod] = useState("2weeks")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWellbeing = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(`/api/wellbeing?period=${period}`)
      if (res.ok) {
        setData(await res.json())
      } else {
        setError("Failed to load well-being data")
      }
    } catch {
      setError("Failed to load well-being data")
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/")
      return
    }
    if (!authLoading && isAdmin) {
      setLoading(true)
      fetchWellbeing()
    }
  }, [authLoading, isAdmin, router, fetchWellbeing])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchWellbeing()
    setRefreshing(false)
  }

  const sortedMembers = data?.members
    ? [...data.members].sort((a, b) => b.burnoutScore - a.burnoutScore)
    : []

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 animate-ping absolute inset-0" />
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
              <HeartPulse className="h-8 w-8 text-rose-500" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Loading well-being data...</p>
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-pink-500/10 via-transparent to-transparent" />
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
                <HeartPulse className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Burnout & Well-Being</h1>
                {org && (
                  <p className="text-xs text-white/60">{org.orgName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[110px] rounded-xl text-xs bg-white/10 border-white/10 text-white hover:bg-white/20">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1week">1 Week</SelectItem>
                  <SelectItem value="2weeks">2 Weeks</SelectItem>
                  <SelectItem value="4weeks">4 Weeks</SelectItem>
                </SelectContent>
              </Select>
              <RefreshButton onRefresh={handleRefresh} refreshing={refreshing} className="text-white/70 hover:text-white hover:bg-white/10" />
              <ThemeToggle />
              <NotificationCenter />
            </div>
          </div>
        </header>

        {/* Stats Cards in Hero */}
        <div className="relative z-10 px-4 pt-4 pb-6 max-w-6xl mx-auto lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-2">
                <HeartPulse className="h-5 w-5 text-white" />
              </div>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-7 w-12 bg-white/10 rounded mx-auto" />
                  <div className="h-3 w-16 bg-white/10 rounded mx-auto" />
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-white">{Math.round(data?.teamHealthScore || 0)}</p>
                  <p className="text-xs text-white/60">Team Health</p>
                </>
              )}
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center relative">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="h-5 w-5 text-rose-400" />
              </div>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-7 w-8 bg-white/10 rounded mx-auto" />
                  <div className="h-3 w-14 bg-white/10 rounded mx-auto" />
                </div>
              ) : (
                <>
                  <p className={`text-2xl font-bold ${(data?.membersAtRisk || 0) > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {data?.membersAtRisk || 0}
                  </p>
                  <p className="text-xs text-white/60">At Risk</p>
                  {(data?.membersAtRisk || 0) > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </>
              )}
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-7 w-10 bg-white/10 rounded mx-auto" />
                  <div className="h-3 w-16 bg-white/10 rounded mx-auto" />
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-blue-400">{(data?.avgDailyHours || 0).toFixed(1)}h</p>
                  <p className="text-xs text-white/60">Avg Daily</p>
                </>
              )}
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
                <Coffee className="h-5 w-5 text-amber-400" />
              </div>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-7 w-12 bg-white/10 rounded mx-auto" />
                  <div className="h-3 w-16 bg-white/10 rounded mx-auto" />
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-amber-400">{Math.round(data?.breakSkipRate || 0)}%</p>
                  <p className="text-xs text-white/60">Break Skips</p>
                </>
              )}
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
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </motion.div>
          )}

          {/* Member Risk Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-rose-500" />
                  </div>
                  Member Risk Assessment
                  {!loading && sortedMembers.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {sortedMembers.length} members
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </div>
                ) : sortedMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <HeartPulse className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No well-being data available for this period.
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Try selecting a different time range.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table Header */}
                    <div className="hidden lg:grid lg:grid-cols-6 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b mb-2">
                      <span>Email</span>
                      <span>Burnout Score</span>
                      <span>Consec. Days</span>
                      <span>OT Minutes</span>
                      <span>Break Skips</span>
                      <span>Avg Daily Min</span>
                    </div>

                    <div className="space-y-2">
                      {sortedMembers.map((member, index) => (
                        <motion.div
                          key={member.email}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 bg-muted/50 rounded-xl hover:bg-muted/70 transition-colors"
                        >
                          {/* Desktop Layout */}
                          <div className="hidden lg:grid lg:grid-cols-6 gap-4 items-center">
                            <p className="text-sm font-medium truncate" title={member.email}>
                              {member.email}
                            </p>
                            <div>
                              <Badge
                                className={`${getBurnoutColor(member.burnoutScore)} border-0 font-semibold`}
                              >
                                {member.burnoutScore} - {getBurnoutLabel(member.burnoutScore)}
                              </Badge>
                            </div>
                            <p className="text-sm tabular-nums">{member.consecutiveDays} days</p>
                            <p className="text-sm tabular-nums">{member.overtimeMinutes} min</p>
                            <p className="text-sm tabular-nums">{member.breakSkips}</p>
                            <p className="text-sm tabular-nums">{member.avgDailyMinutes} min</p>
                          </div>

                          {/* Mobile Layout */}
                          <div className="lg:hidden space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate flex-1" title={member.email}>
                                {member.email}
                              </p>
                              <Badge
                                className={`${getBurnoutColor(member.burnoutScore)} border-0 font-semibold ml-2`}
                              >
                                {member.burnoutScore}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {member.consecutiveDays} consec. days
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {member.overtimeMinutes} OT min
                              </span>
                              <span className="flex items-center gap-1">
                                <Coffee className="h-3 w-3" />
                                {member.breakSkips} break skips
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {member.avgDailyMinutes} avg min/day
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </motion.div>
  )
}
