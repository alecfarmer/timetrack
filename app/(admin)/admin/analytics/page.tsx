"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/bottom-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { WeeklyHoursChart } from "@/components/charts/weekly-hours-chart"
import { ComplianceTrendChart } from "@/components/charts/compliance-trend-chart"
import { LocationPieChart } from "@/components/charts/location-pie-chart"
import { MemberComparisonChart } from "@/components/charts/member-comparison-chart"
import {
  BarChart3,
  ArrowLeft,
  Loader2,
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
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<Analytics | null>(null)
  const [period, setPeriod] = useState("4weeks")
  const [loading, setLoading] = useState(true)
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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const overview = data?.overview

  return (
    <motion.div className="flex flex-col min-h-screen bg-background" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="sticky top-0 z-50 glass border-b lg:ml-64">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => router.push("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <BarChart3 className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Analytics</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-lg p-0.5">
              {[
                { value: "1week", label: "1W" },
                { value: "4weeks", label: "4W" },
                { value: "3months", label: "3M" },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    period === p.value ? "bg-background shadow text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 lg:pb-8 lg:ml-64">
        <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive flex-1">{error}</p>
              <Button variant="outline" size="sm" onClick={() => { setError(null); fetchAnalytics() }}>
                Retry
              </Button>
            </div>
          )}

          {/* Overview Cards */}
          {overview && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Members</p>
                  </div>
                  <p className="text-2xl font-bold">{overview.totalMembers}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Avg Compliance</p>
                  </div>
                  <p className="text-2xl font-bold">{Math.round(overview.avgComplianceRate)}%</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Total Hours</p>
                  </div>
                  <p className="text-2xl font-bold">{Math.round(overview.totalHoursTracked)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Avg Hrs/Day</p>
                  </div>
                  <p className="text-2xl font-bold">{overview.avgHoursPerDay.toFixed(1)}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Charts Row 1 */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Weekly Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <WeeklyHoursChart data={data?.weeklyTrends || []} />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Compliance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ComplianceTrendChart data={data?.weeklyTrends || []} />
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Location Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <LocationPieChart data={data?.locationBreakdown || []} />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Member Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <MemberComparisonChart data={data?.memberSummary || []} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <BottomNav currentPath="/admin" />
    </motion.div>
  )
}
