"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import { BarChart3, Download, FileText } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
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

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
}

export default function ReportsPage() {
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null)
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>("weekly")

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
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
      setLoading(false)
    }
    fetchReports()
  }, [])

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
      initial="initial" animate="animate" exit="exit" variants={pageVariants}
    >
      <header className="sticky top-0 z-50 glass border-b lg:ml-64">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold">Reports</h1>
          </div>
          <h1 className="hidden lg:block text-xl font-semibold">Reports</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 rounded-xl">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2 rounded-xl">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>
      </header>

      <motion.main
        className="flex-1 pb-24 lg:pb-8 lg:ml-64"
        variants={staggerContainer} initial="initial" animate="animate"
      >
        <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8">
          <Tabs defaultValue="weekly" className="w-full" onValueChange={(v) => setActiveTab(v)}>
            <TabsList className="grid w-full grid-cols-2 max-w-md rounded-xl">
              <TabsTrigger value="weekly" className="rounded-lg">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" className="rounded-lg">Monthly</TabsTrigger>
            </TabsList>

            <TabsContent value="weekly" className="mt-6">
              {weekSummary && <WeeklyReport weekSummary={weekSummary} />}
            </TabsContent>

            <TabsContent value="monthly" className="mt-6">
              {monthSummary && <MonthlyReport monthSummary={monthSummary} />}
            </TabsContent>
          </Tabs>
        </div>
      </motion.main>

      <BottomNav currentPath="/reports" />
    </motion.div>
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
