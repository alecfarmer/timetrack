"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, MapPin, Calendar } from "lucide-react"
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

      // Fetch entries for the month
      const res = await fetch(
        `/api/entries?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      )
      const data = await res.json()
      const entries = data.entries || []

      // Group entries by date
      const dayDataMap = new Map<string, Entry[]>()
      entries.forEach((entry: Entry) => {
        const dateKey = format(new Date(entry.timestampServer), "yyyy-MM-dd")
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

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-xl font-bold">History</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {/* Month Navigator */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              {monthData.map((dayData, index) => {
                const dayOfWeek = dayData.date.getDay()
                const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1

                return (
                  <motion.button
                    key={dayData.date.toISOString()}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDate(dayData.date)}
                    className={cn(
                      "aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative",
                      index === 0 && `col-start-${adjustedDay + 1}`,
                      isToday(dayData.date) && "ring-2 ring-primary",
                      selectedDate && format(selectedDate, "yyyy-MM-dd") === format(dayData.date, "yyyy-MM-dd")
                        ? "bg-primary text-primary-foreground"
                        : dayData.hasWork
                        ? "bg-success/20 text-success-foreground"
                        : "hover:bg-muted"
                    )}
                    style={index === 0 ? { gridColumnStart: adjustedDay + 1 } : undefined}
                  >
                    {format(dayData.date, "d")}
                    {dayData.hasWork && (
                      <div className="absolute bottom-1 w-1 h-1 rounded-full bg-success" />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDayData?.entries.length ? (
                  <div className="space-y-2">
                    {selectedDayData.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg",
                          entry.type === "CLOCK_IN" ? "bg-success/10" : "bg-destructive/10"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant={entry.type === "CLOCK_IN" ? "success" : "destructive"}>
                            {entry.type === "CLOCK_IN" ? "IN" : "OUT"}
                          </Badge>
                          <span className="font-mono">
                            {format(new Date(entry.timestampServer), "HH:mm:ss")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {entry.location.name}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No entries for this day
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>

      <BottomNav currentPath="/history" />
    </div>
  )
}
