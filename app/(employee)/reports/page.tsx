"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { RefreshButton } from "@/components/pull-to-refresh"
import {
  MetricCard,
  Sparkline,
  ProgressRing,
  HorizontalBarChart,
  DonutChart,
  WeeklyHeatmap,
  TimeComparison,
  ProductivityScore,
  StatRow,
} from "@/components/analytics/enterprise-charts"
import { WeeklyReport } from "@/components/reports/weekly-report"
import { MonthlyReport } from "@/components/reports/monthly-report"
import {
  BarChart3,
  Download,
  FileText,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Home,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { tzHeaders, cn } from "@/lib/utils"
import { format } from "date-fns"

interface WeekDay {
  date: string
  dayOfWeek: string
  dayNumber: number
  worked: boolean
  minutes: number
  locationCode: string | null
  locationCategory: string | null
}

interface WeekSummary {
  weekStart: string
  weekEnd: string
  daysWorked: number
  requiredDays: number
  totalMinutes: number
  requiredMinutesPerWeek: number
  hoursOnTrack: boolean
  isCompliant: boolean
  weekDays: WeekDay[]
}

interface MonthSummary {
  weeksCompliant: number
  totalWeeks: number
  totalDaysWorked: number
  totalMinutes: number
  weeklyBreakdown?: {
    weekStart: string
    weekEnd: string
    daysWorked: number
    requiredDays: number
    isCompliant: boolean
    totalMinutes: number
  }[]
  byLocation?: Record<string, { days: number; minutes: number }>
}

export default function ReportsPage() {
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null)
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("overview")

  const fetchReports = async () => {
    try {
      const [weekRes, monthRes] = await Promise.all([
        fetch("/api/workdays/week", { headers: tzHeaders() }),
        fetch("/api/reports/monthly", { headers: tzHeaders() }),
      ])
      if (weekRes.ok) setWeekSummary(await weekRes.json())
      if (monthRes.ok) setMonthSummary(await monthRes.json())
    } catch (error) {
      console.error("Failed to fetch reports:", error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchReports()
      setLoading(false)
    }
    loadData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchReports()
    setRefreshing(false)
  }

  const handleExportCSV = () => {
    const period = activeTab === "monthly" ? "monthly" : "weekly"
    window.open(`/api/export?format=csv&period=${period}&date=${new Date().toISOString()}`, "_blank")
  }

  const handleExportPDF = async () => {
    const period = activeTab === "monthly" ? "monthly" : "weekly"
    try {
      const res = await fetch(`/api/export?format=json&period=${period}&date=${new Date().toISOString()}`)
      const data = await res.json()
      const html = generatePrintableReport(data)
      const w = window.open("", "_blank")
      if (w) { w.document.write(html); w.document.close() }
    } catch (err) {
      console.error("Export failed:", err)
    }
  }

  // Calculate metrics
  const weeklyHours = weekSummary ? Math.round(weekSummary.totalMinutes / 60 * 10) / 10 : 0
  const monthlyHours = monthSummary ? Math.round(monthSummary.totalMinutes / 60 * 10) / 10 : 0
  const avgDailyHours = weekSummary && weekSummary.daysWorked > 0
    ? Math.round((weekSummary.totalMinutes / 60 / weekSummary.daysWorked) * 10) / 10
    : 0
  const complianceRate = monthSummary && monthSummary.totalWeeks > 0
    ? Math.round((monthSummary.weeksCompliant / monthSummary.totalWeeks) * 100)
    : 100
  const productivityScore = Math.min(100, Math.round((avgDailyHours / 8) * 100))

  // Location breakdown for donut chart
  const locationData = monthSummary?.byLocation
    ? Object.entries(monthSummary.byLocation).map(([name, data]) => ({
        label: name === "HOME" ? "Remote" : name === "OFFICE" ? "Office" : name,
        value: Math.round(data.minutes / 60),
        color: name === "HOME" ? "#3b82f6" : name === "OFFICE" ? "#10b981" : "#8b5cf6",
      }))
    : []

  // Weekly heatmap data
  const heatmapData = weekSummary?.weekDays?.map((d) => ({
    label: d.dayOfWeek,
    value: Math.round(d.minutes / 60),
  })) || []

  // Weekly trend (simulated from monthly breakdown)
  const weeklyTrend = monthSummary?.weeklyBreakdown?.map((w) => Math.round(w.totalMinutes / 60)) || [38, 40, 36, weeklyHours]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 bg-background">
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
          <p className="text-muted-foreground font-medium">Loading reports...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col bg-background min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <PageHeader
        title="Reports & Analytics"
        subtitle="Track your time and performance"
        actions={
          <div className="flex items-center gap-2">
            <RefreshButton onRefresh={handleRefresh} refreshing={refreshing} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-2 rounded-xl"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="gap-2 rounded-xl"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Export PDF</span>
            </Button>
          </div>
        }
      />

      <main className="flex-1 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
          {/* Hero Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-primary/0">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">This Week</p>
                      <p className="text-3xl font-bold tracking-tight mt-1">{weeklyHours}h</p>
                      <div className="flex items-center gap-1 mt-1">
                        {weeklyHours >= 40 ? (
                          <span className="text-xs text-emerald-600 flex items-center gap-0.5">
                            <ArrowUpRight className="h-3 w-3" />
                            On track
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {Math.max(0, 40 - weeklyHours)}h remaining
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="relative overflow-hidden border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/0">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">This Month</p>
                      <p className="text-3xl font-bold tracking-tight mt-1 text-blue-600 dark:text-blue-400">{monthlyHours}h</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {monthSummary?.totalDaysWorked || 0} days worked
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-500/10">
                      <Calendar className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className={cn(
                "relative overflow-hidden",
                complianceRate >= 80
                  ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-emerald-500/0"
                  : "border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-amber-500/0"
              )}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Compliance</p>
                      <p className={cn(
                        "text-3xl font-bold tracking-tight mt-1",
                        complianceRate >= 80 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                      )}>
                        {complianceRate}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {monthSummary?.weeksCompliant || 0}/{monthSummary?.totalWeeks || 0} weeks
                      </p>
                    </div>
                    <ProgressRing
                      value={complianceRate}
                      max={100}
                      size={52}
                      strokeWidth={5}
                      color={complianceRate >= 80 ? "#10b981" : "#f59e0b"}
                      showPercent
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="relative overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-violet-500/0">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Productivity</p>
                      <p className="text-3xl font-bold tracking-tight mt-1 text-violet-600 dark:text-violet-400">
                        {productivityScore}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {avgDailyHours}h avg/day
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-violet-500/10">
                      <Zap className="h-5 w-5 text-violet-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Tabs Content */}
          <Tabs defaultValue="overview" className="w-full" onValueChange={(v) => setActiveTab(v)}>
            <TabsList className="grid w-full sm:w-auto sm:inline-grid grid-cols-3 max-w-lg rounded-xl bg-muted/50">
              <TabsTrigger value="overview" className="rounded-lg gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="weekly" className="rounded-lg gap-2">
                <Calendar className="h-4 w-4" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="rounded-lg gap-2">
                <TrendingUp className="h-4 w-4" />
                Monthly
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Analytics */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Weekly Activity Heatmap */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Weekly Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <WeeklyHeatmap data={heatmapData} maxValue={10} />
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-emerald-500" /> 8+ hours
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-emerald-300" /> 4-8 hours
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-muted" /> No work
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {weekSummary?.daysWorked || 0}/{weekSummary?.requiredDays || 3} days
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Time Trend */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          Time Trend
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">Last 4 weeks</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-6">
                        <Sparkline
                          data={weeklyTrend}
                          width={200}
                          height={60}
                          showArea
                        />
                        <div className="flex-1 space-y-3">
                          {weeklyTrend.map((hours, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-16">
                                Week {i + 1}
                              </span>
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-primary rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(hours / 50) * 100}%` }}
                                  transition={{ delay: i * 0.1 }}
                                />
                              </div>
                              <span className="text-sm font-medium tabular-nums w-10">{hours}h</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Daily Breakdown */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Daily Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <HorizontalBarChart
                        data={weekSummary?.weekDays?.map((d) => ({
                          label: d.dayOfWeek.slice(0, 3),
                          value: Math.round(d.minutes / 60 * 10) / 10,
                          color: d.minutes >= 480 ? "#10b981" : d.minutes >= 240 ? "#f59e0b" : "#ef4444",
                          subLabel: d.worked ? (d.locationCategory === "HOME" ? "Remote" : "Office") : undefined,
                        })) || []}
                        maxValue={10}
                        formatValue={(v) => `${v}h`}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Location Distribution */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        Work Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {locationData.length > 0 ? (
                        <DonutChart
                          data={locationData}
                          size={120}
                          strokeWidth={20}
                          centerLabel={`${monthlyHours}h`}
                          centerSubLabel="total"
                        />
                      ) : (
                        <div className="flex flex-col items-center py-6 text-center">
                          <MapPin className="h-8 w-8 text-muted-foreground/30 mb-2" />
                          <p className="text-sm text-muted-foreground">No location data</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        Quick Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <StatRow
                        icon={<Clock className="h-4 w-4 text-blue-500" />}
                        label="Avg Hours/Day"
                        value={`${avgDailyHours}h`}
                        trend={avgDailyHours >= 8 ? "up" : "down"}
                      />
                      <StatRow
                        icon={<Target className="h-4 w-4 text-emerald-500" />}
                        label="Days Worked"
                        value={`${weekSummary?.daysWorked || 0}`}
                        subValue={`of ${weekSummary?.requiredDays || 3} required`}
                      />
                      <StatRow
                        icon={<TrendingUp className="h-4 w-4 text-violet-500" />}
                        label="Overtime"
                        value={`${Math.max(0, weeklyHours - 40)}h`}
                        trend={weeklyHours > 40 ? "up" : "neutral"}
                      />
                      <StatRow
                        icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        label="Compliance"
                        value={weekSummary?.isCompliant ? "Yes" : "No"}
                        trend={weekSummary?.isCompliant ? "up" : "down"}
                      />
                    </CardContent>
                  </Card>

                  {/* Week Comparison */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        vs Last Week
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TimeComparison
                        current={{ label: "This Week", value: weeklyHours }}
                        previous={{ label: "Last Week", value: weeklyTrend[weeklyTrend.length - 2] || weeklyHours }}
                        formatValue={(v) => `${v}h`}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Weekly Tab */}
            <TabsContent value="weekly" className="mt-6">
              {weekSummary ? (
                <WeeklyReport weekSummary={weekSummary} />
              ) : (
                <EmptyReportState period="week" />
              )}
            </TabsContent>

            {/* Monthly Tab */}
            <TabsContent value="monthly" className="mt-6">
              {monthSummary ? (
                <MonthlyReport monthSummary={monthSummary} />
              ) : (
                <EmptyReportState period="month" />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </motion.div>
  )
}

function EmptyReportState({ period }: { period: "week" | "month" }) {
  return (
    <Card className="border-dashed rounded-2xl">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Clock className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          {period === "week"
            ? "Clock in to start building your weekly report. Your time entries will appear here."
            : "Work data from this month will appear here once you start tracking time."}
        </p>
      </CardContent>
    </Card>
  )
}

function generatePrintableReport(data: Record<string, unknown>): string {
  const days = data.days as Array<{ date: string; dayName: string; location: string | null; totalMinutes: number; leave: { type: string } | null }>
  const summary = data.summary as { totalMinutes: number; onsiteDays: number; wfhDays: number; leaveDays: number }
  const fmtH = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`
  return `<!DOCTYPE html><html><head><title>KPR Report - ${data.period}</title>
<style>body{font-family:-apple-system,sans-serif;max-width:900px;margin:40px auto;padding:0 20px;color:#1a1a1a}h1{color:#2563EB;border-bottom:3px solid #2563EB;padding-bottom:12px;font-size:28px}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{padding:12px 16px;text-align:left;border-bottom:1px solid #e5e7eb}th{background:#f8fafc;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.5px;color:#64748b}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin:24px 0}.stat{background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%);border-radius:16px;padding:24px;text-align:center;border:1px solid #e2e8f0}.stat-value{font-size:32px;font-weight:700;color:#2563EB;line-height:1}.stat-label{font-size:12px;color:#64748b;margin-top:8px;text-transform:uppercase;letter-spacing:0.5px}.compliant{color:#10b981}.non-compliant{color:#ef4444}@media print{body{margin:0}.stat{break-inside:avoid}}</style></head><body>
<h1>Time & Attendance Report</h1>
<p style="color:#64748b;margin-bottom:32px"><strong>Employee:</strong> ${data.userName} &nbsp;|&nbsp; <strong>Period:</strong> ${data.period} &nbsp;|&nbsp; <strong>Generated:</strong> ${format(new Date(), "MMMM d, yyyy")}</p>
<div class="summary"><div class="stat"><div class="stat-value">${fmtH(summary.totalMinutes)}</div><div class="stat-label">Total Hours</div></div><div class="stat"><div class="stat-value">${summary.onsiteDays}</div><div class="stat-label">On-Site Days</div></div><div class="stat"><div class="stat-value">${summary.wfhDays}</div><div class="stat-label">Remote Days</div></div><div class="stat"><div class="stat-value">${summary.leaveDays}</div><div class="stat-label">Leave Days</div></div></div>
<table><thead><tr><th>Date</th><th>Day</th><th>Location</th><th>Hours</th><th>Status</th></tr></thead><tbody>
${days.map((d) => `<tr><td>${d.date}</td><td>${d.dayName}</td><td>${d.location || "—"}</td><td>${d.totalMinutes > 0 ? fmtH(d.totalMinutes) : "—"}</td><td class="${d.totalMinutes >= 480 ? "compliant" : "non-compliant"}">${d.leave ? d.leave.type : d.totalMinutes > 0 ? (d.totalMinutes >= 480 ? "✓ Full Day" : "Partial") : "—"}</td></tr>`).join("\n")}
</tbody></table>
<p style="color:#94a3b8;font-size:11px;margin-top:48px;padding-top:16px;border-top:1px solid #e2e8f0">Generated by KPR Time & Attendance • ${format(new Date(), "PPpp")}</p>
<script>window.print()</script></body></html>`
}
