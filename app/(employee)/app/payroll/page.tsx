"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { format, addMonths, subMonths } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NotificationCenter } from "@/components/notification-center"
import { RefreshButton } from "@/components/pull-to-refresh"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  DollarSign,
  Clock,
  AlertTriangle,
  Phone,
  Palmtree,
  Building2,
  Home,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DailyBreakdown {
  date: string
  dayName: string
  totalMinutes: number
  location: string | null
  category: string | null
  isLeave: boolean
  leaveType: string | null
}

interface WeekTimesheet {
  weekStart: string
  weekEnd: string
  regularMinutes: number
  overtimeMinutes: number
  calloutMinutes: number
  onsiteMinutes: number
  wfhMinutes: number
  leaveDays: number
  totalMinutes: number
  dailyBreakdown: DailyBreakdown[]
}

interface PayrollData {
  employee: string
  period: string
  weeks: WeekTimesheet[]
  totals: {
    regularMinutes: number
    overtimeMinutes: number
    calloutMinutes: number
    onsiteMinutes: number
    wfhMinutes: number
    leaveDays: number
    totalMinutes: number
  }
}

const fmtH = (mins: number) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

const fmtDecimal = (mins: number) => (mins / 60).toFixed(2)

export default function PayrollPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [data, setData] = useState<PayrollData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null)

  const fetchPayroll = async () => {
    try {
      const month = format(currentMonth, "yyyy-MM")
      const res = await fetch(`/api/payroll?month=${month}`)
      if (res.ok) {
        setData(await res.json())
      }
    } catch (error) {
      console.error("Failed to fetch payroll:", error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchPayroll()
      setLoading(false)
    }
    loadData()
  }, [currentMonth])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchPayroll()
    setRefreshing(false)
  }

  const handleExportCSV = async () => {
    const month = format(currentMonth, "yyyy-MM")
    window.open(`/api/payroll?month=${month}&format=csv`, "_blank")
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
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Generating timesheet...</p>
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent" />
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
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-white">Payroll</h1>
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
            </div>
          </div>
        </header>

        {/* Month Navigation */}
        <div className="relative z-10 px-4 pt-4 pb-6 max-w-6xl mx-auto lg:px-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth((p) => subMonths(p, 1))}
              className="rounded-xl h-9 w-9 text-white/70 hover:text-white hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold text-white min-w-[180px] text-center">
              {data?.period || format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth((p) => addMonths(p, 1))}
              className="rounded-xl h-9 w-9 text-white/70 hover:text-white hover:bg-white/10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Summary Cards */}
          {data && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                <Clock className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white tabular-nums">{fmtDecimal(data.totals.regularMinutes)}</p>
                <p className="text-xs text-white/60">Regular Hours</p>
              </div>
              <div className={cn(
                "bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center",
                data.totals.overtimeMinutes > 0 && "ring-2 ring-amber-500/30"
              )}>
                <AlertTriangle className="h-5 w-5 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-400 tabular-nums">{fmtDecimal(data.totals.overtimeMinutes)}</p>
                <p className="text-xs text-white/60">Overtime Hours</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                <Phone className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white tabular-nums">{fmtDecimal(data.totals.calloutMinutes)}</p>
                <p className="text-xs text-white/60">Callout Hours</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                <Palmtree className="h-5 w-5 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white tabular-nums">{data.totals.leaveDays}</p>
                <p className="text-xs text-white/60">Leave Days</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 lg:pb-8 -mt-4">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          {data && (
            <>
              {/* Grand Total */}
              <Card className="border-0 shadow-xl rounded-2xl mb-6 bg-primary/5 ring-1 ring-primary/20">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Grand Total</p>
                    <p className="text-3xl font-bold">{fmtH(data.totals.totalMinutes)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Decimal</p>
                    <p className="text-3xl font-bold tabular-nums">{fmtDecimal(data.totals.totalMinutes)}h</p>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Breakdown */}
              <div className="space-y-4">
                {data.weeks.map((week, i) => (
                  <Card key={i} className="border-0 shadow-lg rounded-2xl">
                    <CardContent className="p-0">
                      {/* Week header */}
                      <button
                        onClick={() => setExpandedWeek(expandedWeek === i ? null : i)}
                        className="w-full p-5 flex items-center justify-between hover:bg-muted/30 transition-colors rounded-xl"
                      >
                        <div>
                          <p className="text-sm font-semibold">
                            {format(new Date(week.weekStart), "MMM d")} – {format(new Date(week.weekEnd), "MMM d")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {fmtH(week.totalMinutes)} total
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {week.overtimeMinutes > 0 && (
                            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0 text-xs">
                              +{fmtDecimal(week.overtimeMinutes)} OT
                            </Badge>
                          )}
                          {week.calloutMinutes > 0 && (
                            <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-0 text-xs">
                              {fmtDecimal(week.calloutMinutes)} callout
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {fmtDecimal(week.regularMinutes)}h reg
                          </Badge>
                          <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", expandedWeek === i && "rotate-90")} />
                        </div>
                      </button>

                      {/* Daily breakdown */}
                      {expandedWeek === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t"
                        >
                          <div className="p-4 space-y-1">
                            {week.dailyBreakdown.map((day) => (
                              <div key={day.date} className="grid grid-cols-12 gap-2 items-center px-3 py-2 rounded-xl hover:bg-muted/30">
                                <div className="col-span-2">
                                  <p className="text-sm font-medium">{day.dayName}</p>
                                  <p className="text-xs text-muted-foreground">{format(new Date(day.date), "MMM d")}</p>
                                </div>
                                <div className="col-span-3">
                                  {day.isLeave ? (
                                    <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-0 text-xs">
                                      <Palmtree className="h-3 w-3 mr-1" />
                                      {day.leaveType}
                                    </Badge>
                                  ) : day.location ? (
                                    <div className="flex items-center gap-1.5">
                                      {day.category === "HOME" ? (
                                        <Home className="h-3 w-3 text-blue-500" />
                                      ) : (
                                        <Building2 className="h-3 w-3 text-muted-foreground" />
                                      )}
                                      <span className="text-sm">{day.location}</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </div>
                                <div className="col-span-4">
                                  {day.totalMinutes > 0 ? (
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className={cn(
                                            "h-full rounded-full",
                                            day.totalMinutes >= 480 ? "bg-emerald-500" : day.totalMinutes > 0 ? "bg-primary" : ""
                                          )}
                                          style={{ width: `${Math.min(100, (day.totalMinutes / 480) * 100)}%` }}
                                        />
                                      </div>
                                      <span className="text-xs tabular-nums text-muted-foreground">{fmtH(day.totalMinutes)}</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </div>
                                <div className="col-span-3 text-right">
                                  <span className="text-sm tabular-nums font-medium">
                                    {day.totalMinutes > 0 ? `${fmtDecimal(day.totalMinutes)}h` : "—"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </motion.div>
  )
}
