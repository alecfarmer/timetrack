"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { BottomNav } from "@/components/bottom-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  HeartPulse,
  AlertTriangle,
  Coffee,
  Clock,
  TrendingUp,
  ArrowLeft,
  Loader2,
  AlertCircle,
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

function SkeletonCard() {
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="h-8 w-16 bg-muted rounded" />
        </div>
      </CardContent>
    </Card>
  )
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
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<WellbeingData | null>(null)
  const [period, setPeriod] = useState("2weeks")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWellbeing = useCallback(async () => {
    setLoading(true)
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
      fetchWellbeing()
    }
  }, [authLoading, isAdmin, router, fetchWellbeing])

  const sortedMembers = data?.members
    ? [...data.members].sort((a, b) => b.burnoutScore - a.burnoutScore)
    : []

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-background"
      initial="initial"
      animate="animate"
      variants={pageVariants}
    >
      <header className="sticky top-0 z-50 glass border-b lg:ml-64">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => router.push("/admin")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <HeartPulse className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Burnout &amp; Well-Being</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[130px] rounded-xl text-xs">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1week">1 Week</SelectItem>
                <SelectItem value="2weeks">2 Weeks</SelectItem>
                <SelectItem value="4weeks">4 Weeks</SelectItem>
              </SelectContent>
            </Select>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <motion.main
        className="flex-1 pb-24 lg:pb-8 lg:ml-64"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive flex-1">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
          )}

          {/* Overview Cards */}
          <motion.div variants={staggerItem} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : data ? (
              <>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <HeartPulse className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Team Health Score</p>
                    </div>
                    <p className="text-2xl font-bold">{Math.round(data.teamHealthScore)}</p>
                    <p className="text-[10px] text-muted-foreground">out of 100</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Members At Risk</p>
                    </div>
                    <p className={`text-2xl font-bold ${data.membersAtRisk > 0 ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
                      {data.membersAtRisk}
                    </p>
                    <p className="text-[10px] text-muted-foreground">burnout score &ge; 50</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Avg Daily Hours</p>
                    </div>
                    <p className="text-2xl font-bold">{data.avgDailyHours.toFixed(1)}</p>
                    <p className="text-[10px] text-muted-foreground">hours per day</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Coffee className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Break Skip Rate</p>
                    </div>
                    <p className="text-2xl font-bold">{Math.round(data.breakSkipRate)}%</p>
                    <p className="text-[10px] text-muted-foreground">missed breaks</p>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </motion.div>

          {/* Member Risk Table */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Member Risk Assessment
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
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No well-being data available for this period.
                  </p>
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
                      {sortedMembers.map((member) => (
                        <motion.div
                          key={member.email}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-4 bg-muted/50 rounded-xl"
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
      </motion.main>

      <BottomNav currentPath="/admin" />
    </motion.div>
  )
}
