"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import { BarChart3, Download, Clock, Calendar, CheckCircle, TrendingUp, Building2 } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"

interface WeekSummary {
  daysWorked: number
  requiredDays: number
  totalMinutes: number
  isCompliant: boolean
}

interface MonthSummary {
  weeksCompliant: number
  totalWeeks: number
  totalDaysWorked: number
  totalMinutes: number
  byLocation?: Record<string, { days: number; minutes: number }>
}

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function ReportsPage() {
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null)
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const [weekRes, monthRes] = await Promise.all([
        fetch("/api/workdays/week"),
        fetch("/api/reports/monthly"),
      ])

      if (weekRes.ok) {
        const weekData = await weekRes.json()
        setWeekSummary(weekData)
      }

      if (monthRes.ok) {
        const monthData = await monthRes.json()
        setMonthSummary(monthData)
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error)
    }
    setLoading(false)
  }

  const formatHoursMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const handleExportCSV = () => {
    alert("CSV export coming soon!")
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
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {/* Header */}
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
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <motion.main
        className="flex-1 pb-24 lg:pb-8 lg:ml-64"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8">
          <Tabs defaultValue="weekly" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md rounded-xl">
              <TabsTrigger value="weekly" className="rounded-lg">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" className="rounded-lg">Monthly</TabsTrigger>
            </TabsList>

            <TabsContent value="weekly" className="mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {weekSummary && (
                  <>
                    {/* Compliance Card */}
                    <motion.div variants={staggerItem} className="md:col-span-2 lg:col-span-2">
                      <Card className={`border-0 shadow-xl overflow-hidden ${weekSummary.isCompliant ? "ring-2 ring-success/50" : ""}`}>
                        <div className={`h-2 ${weekSummary.isCompliant ? "bg-success" : "bg-warning"}`} />
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">This Week</p>
                              <p className="text-5xl font-bold">
                                {weekSummary.daysWorked}
                                <span className="text-2xl text-muted-foreground">/{weekSummary.requiredDays}</span>
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">days on-site</p>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={weekSummary.isCompliant ? "success" : "warning"}
                                className="text-base px-4 py-2 gap-2"
                              >
                                {weekSummary.isCompliant && <CheckCircle className="h-4 w-4" />}
                                {weekSummary.isCompliant ? "Compliant" : "In Progress"}
                              </Badge>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-6">
                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((weekSummary.daysWorked / weekSummary.requiredDays) * 100, 100)}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={`h-full rounded-full ${weekSummary.isCompliant ? "bg-success" : "bg-warning"}`}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Time Card */}
                    <motion.div variants={staggerItem}>
                      <Card className="border-0 shadow-lg h-full">
                        <CardContent className="p-6 flex flex-col justify-center h-full">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <p className="text-sm text-muted-foreground">Total Time</p>
                          </div>
                          <p className="text-4xl font-bold">
                            {formatHoursMinutes(weekSummary.totalMinutes)}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">this week</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="monthly" className="mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {monthSummary && (
                  <>
                    {/* Monthly Overview */}
                    <motion.div variants={staggerItem} className="md:col-span-2 lg:col-span-2">
                      <Card className="border-0 shadow-xl">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            {format(new Date(), "MMMM yyyy")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="bg-muted/50 rounded-xl p-4 text-center">
                              <p className="text-4xl font-bold">{monthSummary.weeksCompliant}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                of {monthSummary.totalWeeks} weeks compliant
                              </p>
                            </div>
                            <div className="bg-muted/50 rounded-xl p-4 text-center">
                              <p className="text-4xl font-bold">{monthSummary.totalDaysWorked}</p>
                              <p className="text-sm text-muted-foreground mt-1">days on-site</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Total Time */}
                    <motion.div variants={staggerItem}>
                      <Card className="border-0 shadow-lg h-full">
                        <CardContent className="p-6 flex flex-col justify-center h-full">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <TrendingUp className="h-5 w-5 text-primary" />
                            </div>
                            <p className="text-sm text-muted-foreground">Monthly Total</p>
                          </div>
                          <p className="text-4xl font-bold">
                            {formatHoursMinutes(monthSummary.totalMinutes)}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">time on-site</p>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Location Breakdown */}
                    {monthSummary.byLocation && Object.keys(monthSummary.byLocation).length > 0 && (
                      <motion.div variants={staggerItem} className="md:col-span-2 lg:col-span-3">
                        <Card className="border-0 shadow-lg">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Building2 className="h-5 w-5 text-primary" />
                              Time by Location
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {Object.entries(monthSummary.byLocation).map(([code, data]) => (
                                <div key={code} className="bg-muted/50 rounded-xl p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline">{code}</Badge>
                                    <span className="text-sm text-muted-foreground">{data.days} days</span>
                                  </div>
                                  <p className="text-xl font-semibold">{formatHoursMinutes(data.minutes)}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </motion.main>

      <BottomNav currentPath="/reports" />
    </motion.div>
  )
}
