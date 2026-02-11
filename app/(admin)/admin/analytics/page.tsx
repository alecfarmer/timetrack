"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenter } from "@/components/notification-center"
import { RefreshButton } from "@/components/pull-to-refresh"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

const WeeklyHoursChart = dynamic(() => import("@/components/charts/weekly-hours-chart").then(m => ({ default: m.WeeklyHoursChart })), { ssr: false, loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" /> })
const ComplianceTrendChart = dynamic(() => import("@/components/charts/compliance-trend-chart").then(m => ({ default: m.ComplianceTrendChart })), { ssr: false, loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" /> })
const LocationPieChart = dynamic(() => import("@/components/charts/location-pie-chart").then(m => ({ default: m.LocationPieChart })), { ssr: false, loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" /> })
const MemberComparisonChart = dynamic(() => import("@/components/charts/member-comparison-chart").then(m => ({ default: m.MemberComparisonChart })), { ssr: false, loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" /> })
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"

interface WeeklyTrend {
  weekStart: string
  totalHours: number
  avgHoursPerMember: number
  complianceRate: number
  memberCount: number
}

interface LocationBreakdown {
  locationName: string
  locationCode: string
  totalHours: number
  visitCount: number
}

interface MemberSummary {
  userId: string
  email: string
  totalHours: number
  totalDays: number
  complianceRate: number
}

interface Analytics {
  weeklyTrends: WeeklyTrend[]
  locationBreakdown: LocationBreakdown[]
  memberSummary: MemberSummary[]
  overview: {
    totalMembers: number
    avgComplianceRate: number
    totalHoursTracked: number
    avgHoursPerDay: number
  }
}

export default function AnalyticsPage() {
  const { org, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<Analytics | null>(null)
  const [period, setPeriod] = useState("4weeks")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?period=${period}`)
      const json = await res.json()
      if (res.ok) {
        setData(json)
      } else {
        setError(json?.error || "Failed to load analytics")
      }
    } catch {
      setError("Failed to load analytics")
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
      fetchAnalytics()
    }
  }, [authLoading, isAdmin, router, fetchAnalytics])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
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
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Loading analytics...</p>
        </motion.div>
      </div>
    )
  }

  const overview = data?.overview

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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
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
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Analytics</h1>
                {org && (
                  <p className="text-xs text-white/60">{org.orgName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Period Selector */}
              <div className="flex bg-white/10 backdrop-blur-sm rounded-lg p-0.5 border border-white/10">
                {[
                  { value: "1week", label: "1W" },
                  { value: "4weeks", label: "4W" },
                  { value: "3months", label: "3M" },
                ].map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      period === p.value ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
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
                <Users className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{overview?.totalMembers || 0}</p>
              <p className="text-xs text-white/60">Members</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">{overview ? Math.round(overview.avgComplianceRate) : 0}%</p>
              <p className="text-xs text-white/60">Avg Compliance</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-400">{overview ? Math.round(overview.totalHoursTracked) : 0}</p>
              <p className="text-xs text-white/60">Total Hours</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-5 w-5 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold text-cyan-400">{overview?.avgHoursPerDay?.toFixed(1) || '0.0'}</p>
              <p className="text-xs text-white/60">Avg Hrs/Day</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 lg:pb-8 pt-6">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive flex-1">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => { setError(null); fetchAnalytics() }}>
                Retry
              </Button>
            </motion.div>
          )}

          {/* Charts Row 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid lg:grid-cols-2 gap-6"
          >
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Weekly Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <WeeklyHoursChart data={data?.weeklyTrends || []} />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Compliance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ComplianceTrendChart data={data?.weeklyTrends || []} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Charts Row 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid lg:grid-cols-2 gap-6"
          >
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Location Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <LocationPieChart data={data?.locationBreakdown || []} />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Member Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <MemberComparisonChart data={data?.memberSummary || []} />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </motion.div>
  )
}
