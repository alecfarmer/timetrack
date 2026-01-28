"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns"
import { formatTime, formatDateInZone } from "@/lib/dates"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { ChevronLeft, ChevronRight, MapPin, Calendar, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { BottomNav } from "@/components/bottom-nav"

interface Entry {
  id: string
  type: "CLOCK_IN" | "CLOCK_OUT"
  timestampServer: string
  location: {
    name: string
    code: string | null
  }
}

interface DayData {
  date: Date
  entries: Entry[]
  hasWork: boolean
}

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export default function HistoryPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [monthData, setMonthData] = useState<DayData[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMonthData()
  }, [currentMonth])

  const fetchMonthData = async () => {
    setLoading(true)
    try {
      const start = startOfMonth(currentMonth)
      const end = endOfMonth(currentMonth)
      const days = eachDayOfInterval({ start, end })

      const res = await fetch(
        `/api/entries?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      )
      const data = await res.json()
      const entries = data.entries || []

      const dayDataMap = new Map<string, Entry[]>()
      entries.forEach((entry: Entry) => {
        const dateKey = formatDateInZone(entry.timestampServer, "yyyy-MM-dd")
        if (!dayDataMap.has(dateKey)) {
          dayDataMap.set(dateKey, [])
        }
        dayDataMap.get(dateKey)!.push(entry)
      })

      const monthData: DayData[] = days.map((date) => {
        const dateKey = format(date, "yyyy-MM-dd")
        const dayEntries = dayDataMap.get(dateKey) || []
        return {
          date,
          entries: dayEntries,
          hasWork: dayEntries.some((e) => e.type === "CLOCK_IN"),
        }
      })

      setMonthData(monthData)
    } catch (error) {
      console.error("Failed to fetch month data:", error)
    }
    setLoading(false)
  }

  const previousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const selectedDayData = selectedDate
    ? monthData.find((d) => format(d.date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd"))
    : null

  const daysWorkedThisMonth = monthData.filter((d) => d.hasWork).length

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
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Loading history...</p>
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
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold">History</h1>
          </div>
          <h1 className="hidden lg:block text-xl font-semibold">History</h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24 lg:pb-8 lg:ml-64">
        <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={previousMonth} className="rounded-xl">
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <CardTitle className="text-xl">{format(currentMonth, "MMMM yyyy")}</CardTitle>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2 text-center">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                      <div key={day} className="text-xs font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                    {monthData.map((dayData, index) => {
                      const dayOfWeek = dayData.date.getDay()
                      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1
                      const isSelected = selectedDate && format(selectedDate, "yyyy-MM-dd") === format(dayData.date, "yyyy-MM-dd")

                      return (
                        <motion.button
                          key={dayData.date.toISOString()}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedDate(dayData.date)}
                          className={cn(
                            "aspect-square rounded-xl flex flex-col items-center justify-center text-sm relative transition-all",
                            index === 0 && `col-start-${adjustedDay + 1}`,
                            isToday(dayData.date) && "ring-2 ring-primary ring-offset-2",
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-lg"
                              : dayData.hasWork
                              ? "bg-success/20 hover:bg-success/30"
                              : "hover:bg-muted"
                          )}
                          style={index === 0 ? { gridColumnStart: adjustedDay + 1 } : undefined}
                        >
                          <span className="font-medium">{format(dayData.date, "d")}</span>
                          {dayData.hasWork && !isSelected && (
                            <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-success" />
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats & Selected Day */}
            <div className="space-y-6">
              {/* Month Stats */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-primary">{daysWorkedThisMonth}</p>
                    <p className="text-sm text-muted-foreground mt-1">days on-site this month</p>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Day Details */}
              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        {format(selectedDate, "EEE, MMM d")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedDayData?.entries.length ? (
                        <div className="space-y-2">
                          {selectedDayData.entries.map((entry) => (
                            <div
                              key={entry.id}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-xl",
                                entry.type === "CLOCK_IN" ? "bg-success/10" : "bg-destructive/10"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant={entry.type === "CLOCK_IN" ? "success" : "destructive"} className="text-xs">
                                  {entry.type === "CLOCK_IN" ? "IN" : "OUT"}
                                </Badge>
                                <span className="font-mono text-sm">
                                  {formatTime(entry.timestampServer)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {entry.location.code || entry.location.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No entries this day</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>

      <BottomNav currentPath="/history" />
    </motion.div>
  )
}
