"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NotificationCenter } from "@/components/notification-center"
import { RefreshButton } from "@/components/pull-to-refresh"
import { BarChart3, Download, FileText, Clock, TrendingUp } from "lucide-react"
import { WeeklyReport } from "@/components/reports/weekly-report"
import { MonthlyReport } from "@/components/reports/monthly-report"

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
  const [activeTab, setActiveTab] = useState<string>("weekly")

  const fetchReports = async () => {
    try {
      const [weekRes, monthRes] = await Promise.all([
        fetch("/api/workdays/week"),
        fetch("/api/reports/monthly"),
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

  if (loading) {
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
          <p className="text-muted-foreground font-medium">Loading reports...</p>
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
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-500/20 via-transparent to-transparent" />
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
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-white">Reports</h1>
            </div>
            <div className="flex items-center gap-2">
              <RefreshButton onRefresh={handleRefresh} refreshing={refreshing} className="text-white/70 hover:text-white hover:bg-white/10" />
              <NotificationCenter />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportCSV}
                className="gap-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportPDF}
                className="gap-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Summary Stats */}
        <div className="relative z-10 px-4 pt-4 pb-6 max-w-6xl mx-auto lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center mx-auto mb-2">
                <Clock className="h-5 w-5 text-violet-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                {weekSummary ? Math.floor(weekSummary.totalMinutes / 60) : 0}h
              </p>
              <p className="text-xs text-white/60">This Week</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                {weekSummary?.daysWorked || 0}/{weekSummary?.requiredDays || 0}
              </p>
              <p className="text-xs text-white/60">Days Worked</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                {monthSummary ? Math.floor(monthSummary.totalMinutes / 60) : 0}h
              </p>
              <p className="text-xs text-white/60">This Month</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
                <FileText className="h-5 w-5 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                {monthSummary?.weeksCompliant || 0}/{monthSummary?.totalWeeks || 0}
              </p>
              <p className="text-xs text-white/60">Compliant Weeks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 lg:pb-8 -mt-4">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <Tabs defaultValue="weekly" className="w-full" onValueChange={(v) => setActiveTab(v)}>
            <TabsList className="grid w-full grid-cols-2 max-w-md rounded-xl bg-muted/50">
              <TabsTrigger value="weekly" className="rounded-lg">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" className="rounded-lg">Monthly</TabsTrigger>
            </TabsList>

            <TabsContent value="weekly" className="mt-6">
              {weekSummary ? (
                <WeeklyReport weekSummary={weekSummary} />
              ) : (
                <EmptyReportState period="week" />
              )}
            </TabsContent>

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
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Clock className="h-7 w-7 text-muted-foreground/40" />
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
  return `<!DOCTYPE html><html><head><title>OnSite Report - ${data.period}</title>
<style>body{font-family:-apple-system,sans-serif;max-width:800px;margin:40px auto;padding:0 20px}h1{color:#27509B;border-bottom:3px solid #27509B;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{padding:8px 12px;text-align:left;border-bottom:1px solid #eee}th{background:#f5f5f5;font-weight:600}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:20px 0}.stat{background:#f8f9fa;border-radius:8px;padding:16px;text-align:center}.stat-value{font-size:24px;font-weight:700;color:#27509B}.stat-label{font-size:12px;color:#666;margin-top:4px}@media print{body{margin:0}}</style></head><body>
<h1>OnSite Time Report</h1>
<p><strong>Employee:</strong> ${data.userName}<br><strong>Period:</strong> ${data.period}<br><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
<div class="summary"><div class="stat"><div class="stat-value">${fmtH(summary.totalMinutes)}</div><div class="stat-label">Total Hours</div></div><div class="stat"><div class="stat-value">${summary.onsiteDays}</div><div class="stat-label">On-Site Days</div></div><div class="stat"><div class="stat-value">${summary.wfhDays}</div><div class="stat-label">WFH Days</div></div><div class="stat"><div class="stat-value">${summary.leaveDays}</div><div class="stat-label">Leave Days</div></div></div>
<table><thead><tr><th>Date</th><th>Day</th><th>Location</th><th>Hours</th><th>Status</th></tr></thead><tbody>
${days.map((d) => `<tr><td>${d.date}</td><td>${d.dayName}</td><td>${d.location || "—"}</td><td>${d.totalMinutes > 0 ? fmtH(d.totalMinutes) : "—"}</td><td>${d.leave ? d.leave.type : d.totalMinutes > 0 ? (d.totalMinutes >= 480 ? "Full Day" : "Partial") : "—"}</td></tr>`).join("\n")}
</tbody></table>
<p style="color:#666;font-size:12px;margin-top:40px;">Generated by OnSite Time Tracker</p>
<script>window.print()</script></body></html>`
}
