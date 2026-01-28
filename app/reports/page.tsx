"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Download, Clock, Calendar, CheckCircle } from "lucide-react"
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
      // Fetch weekly and monthly summaries in parallel
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
    // TODO: Implement CSV export
    alert("CSV export coming soon!")
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-xl font-bold">Reports</h1>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4 mt-4">
            {weekSummary && (
              <>
                {/* Compliance Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className={weekSummary.isCompliant ? "border-success" : "border-warning"}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        This Week
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-3xl font-bold">
                            {weekSummary.daysWorked} / {weekSummary.requiredDays}
                          </p>
                          <p className="text-sm text-muted-foreground">days on-site</p>
                        </div>
                        <Badge
                          variant={weekSummary.isCompliant ? "success" : "warning"}
                          className="text-lg px-4 py-2"
                        >
                          {weekSummary.isCompliant ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Compliant
                            </>
                          ) : (
                            "In Progress"
                          )}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Time Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Total Time This Week
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        {formatHoursMinutes(weekSummary.totalMinutes)}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4 mt-4">
            {monthSummary && (
              <>
                {/* Monthly Compliance */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(), "MMMM yyyy")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-2xl font-bold">
                            {monthSummary.weeksCompliant} / {monthSummary.totalWeeks}
                          </p>
                          <p className="text-sm text-muted-foreground">weeks compliant</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{monthSummary.totalDaysWorked}</p>
                          <p className="text-sm text-muted-foreground">days on-site</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Total Time */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Total Time This Month
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        {formatHoursMinutes(monthSummary.totalMinutes)}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav currentPath="/reports" />
    </div>
  )
}
