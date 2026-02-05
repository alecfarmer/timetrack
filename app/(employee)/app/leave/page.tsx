"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Trash2,
  Palmtree,
  Stethoscope,
  PartyPopper,
  UserX,
  Loader2,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BottomNav } from "@/components/bottom-nav"

interface LeaveRequest {
  id: string
  type: string
  date: string
  endDate: string | null
  notes: string | null
  status: string
}

interface LeaveSummary {
  totalDays: number
  byType: Record<string, number>
}

interface PtoBalance {
  annualAllowance: number
  carryover: number
  taken: number
  remaining: number
}

const LEAVE_TYPES = [
  { value: "PTO", label: "PTO / Vacation", icon: Palmtree, color: "text-blue-500 bg-blue-500/10" },
  { value: "SICK", label: "Sick Leave", icon: Stethoscope, color: "text-red-500 bg-red-500/10" },
  { value: "HOLIDAY", label: "Holiday", icon: PartyPopper, color: "text-amber-500 bg-amber-500/10" },
  { value: "PERSONAL", label: "Personal", icon: UserX, color: "text-purple-500 bg-purple-500/10" },
  { value: "OTHER", label: "Other", icon: Calendar, color: "text-muted-foreground bg-muted" },
]

function getLeaveTypeConfig(type: string) {
  return LEAVE_TYPES.find((t) => t.value === type) || LEAVE_TYPES[LEAVE_TYPES.length - 1]
}

export default function LeavePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [yearlySummary, setYearlySummary] = useState<LeaveSummary>({ totalDays: 0, byType: {} })
  const [ptoBalance, setPtoBalance] = useState<PtoBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState("PTO")
  const [formDate, setFormDate] = useState("")
  const [formEndDate, setFormEndDate] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaves()
  }, [currentMonth])

  useEffect(() => {
    fetchYearlySummary()
  }, [currentMonth])

  const fetchLeaves = async () => {
    setLoading(true)
    try {
      const month = format(currentMonth, "yyyy-MM")
      const res = await fetch(`/api/leave?month=${month}`)
      if (res.ok) {
        const data = await res.json()
        setLeaves(data.leaves)
      }
    } catch (error) {
      console.error("Failed to fetch leaves:", error)
    }
    setLoading(false)
  }

  const fetchYearlySummary = async () => {
    try {
      const year = format(currentMonth, "yyyy")
      const res = await fetch(`/api/leave?year=${year}`)
      if (res.ok) {
        const data = await res.json()
        setYearlySummary(data.summary)
        if (data.balance) {
          setPtoBalance(data.balance)
        }
      }
    } catch (error) {
      console.error("Failed to fetch yearly summary:", error)
    }
  }

  const handleSubmit = async () => {
    if (!formDate) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          date: formDate,
          endDate: formEndDate || null,
          notes: formNotes || null,
        }),
      })
      if (res.ok) {
        setShowForm(false)
        setFormDate("")
        setFormEndDate("")
        setFormNotes("")
        setSubmitError(null)
        await Promise.all([fetchLeaves(), fetchYearlySummary()])
      } else {
        const data = await res.json()
        setSubmitError(data.error || "Failed to create leave request")
      }
    } catch (error) {
      console.error("Failed to create leave:", error)
      setSubmitError("Failed to create leave request")
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/leave?id=${id}`, { method: "DELETE" })
      await Promise.all([fetchLeaves(), fetchYearlySummary()])
    } catch (error) {
      console.error("Failed to delete leave:", error)
    }
  }

  const leaveByDate = new Map(leaves.map((l) => [l.date, l]))
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b lg:ml-64">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Palmtree className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold">Leave / PTO</h1>
          </div>
          <h1 className="hidden lg:block text-xl font-semibold">Leave / PTO</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Leave</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 lg:pb-8 lg:ml-64">
        <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8">
          {/* Summary Cards — Full Year */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {ptoBalance && ptoBalance.annualAllowance > 0 ? (
              <>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{ptoBalance.remaining}</p>
                    <p className="text-xs text-muted-foreground">PTO Remaining</p>
                    <p className="text-[10px] text-muted-foreground">of {ptoBalance.annualAllowance + ptoBalance.carryover}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{ptoBalance.taken}</p>
                    <p className="text-xs text-muted-foreground">PTO Used</p>
                  </CardContent>
                </Card>
                {ptoBalance.carryover > 0 && (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">{ptoBalance.carryover}</p>
                      <p className="text-xs text-muted-foreground">Carryover</p>
                    </CardContent>
                  </Card>
                )}
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{yearlySummary.byType["SICK"] || 0}</p>
                    <p className="text-xs text-muted-foreground">Sick Used</p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{yearlySummary.totalDays}</p>
                    <p className="text-xs text-muted-foreground">Total Days ({format(currentMonth, "yyyy")})</p>
                  </CardContent>
                </Card>
                {LEAVE_TYPES.slice(0, 3).map((type) => (
                  <Card key={type.value} className="border-0 shadow-lg">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">{yearlySummary.byType[type.value] || 0}</p>
                      <p className="text-xs text-muted-foreground">{type.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-5">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((p) => subMonths(p, 1))} className="rounded-xl h-9 w-9">
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((p) => addMonths(p, 1))} className="rounded-xl h-9 w-9">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                      <div key={i} className="text-center text-xs font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {days.map((day, index) => {
                      const dateStr = format(day, "yyyy-MM-dd")
                      const leave = leaveByDate.get(dateStr)
                      const dayOfWeek = day.getDay()
                      const isSelected = selectedDate === dateStr
                      const typeConfig = leave ? getLeaveTypeConfig(leave.type) : null

                      return (
                        <motion.button
                          key={dateStr}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                          className={cn(
                            "aspect-square rounded-xl flex flex-col items-center justify-center text-sm relative transition-all",
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-lg"
                              : leave
                              ? typeConfig?.color
                              : "hover:bg-muted/60"
                          )}
                          style={index === 0 ? { gridColumnStart: dayOfWeek + 1 } : undefined}
                        >
                          <span className="font-medium text-[13px]">{format(day, "d")}</span>
                          {leave && !isSelected && (
                            <div className="absolute bottom-1 w-1 h-1 rounded-full bg-current opacity-60" />
                          )}
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-3 border-t">
                    {LEAVE_TYPES.slice(0, 4).map((type) => {
                      const Icon = type.icon
                      return (
                        <div key={type.value} className="flex items-center gap-1.5">
                          <Icon className={cn("h-3 w-3", type.color.split(" ")[0])} />
                          <span className="text-xs text-muted-foreground">{type.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Selected date leave */}
              {selectedDate && leaveByDate.has(selectedDate) && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="border-0 shadow-xl">
                    <CardContent className="p-5">
                      {(() => {
                        const leave = leaveByDate.get(selectedDate)!
                        const config = getLeaveTypeConfig(leave.type)
                        const Icon = config.icon
                        return (
                          <>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", config.color)}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">{config.label}</p>
                                  <p className="text-xs text-muted-foreground">{format(new Date(selectedDate), "MMM d, yyyy")}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(leave.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {leave.notes && (
                              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{leave.notes}</p>
                            )}
                          </>
                        )
                      })()}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Leave list for month */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-3">This Month</h3>
                  {leaves.length > 0 ? (
                    <div className="space-y-2">
                      {(() => {
                        // Group consecutive same-type leaves into ranges for display
                        const groups: { type: string; startDate: string; endDate: string; ids: string[] }[] = []
                        for (const leave of leaves) {
                          const prev = groups[groups.length - 1]
                          if (prev && prev.type === leave.type && leave.endDate && prev.endDate === leave.endDate) {
                            // Same range group — skip duplicate
                            prev.ids.push(leave.id)
                            continue
                          }
                          if (prev && prev.type === leave.type) {
                            // Check if consecutive day
                            const prevEnd = new Date(prev.endDate)
                            const curStart = new Date(leave.date)
                            const diffMs = curStart.getTime() - prevEnd.getTime()
                            if (diffMs <= 86400000) {
                              prev.endDate = leave.date
                              prev.ids.push(leave.id)
                              continue
                            }
                          }
                          groups.push({ type: leave.type, startDate: leave.date, endDate: leave.date, ids: [leave.id] })
                        }
                        return groups.map((group) => {
                          const config = getLeaveTypeConfig(group.type)
                          const Icon = config.icon
                          const dayCount = group.ids.length
                          return (
                            <div key={group.ids[0]} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.color)}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{config.label}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(group.startDate + "T00:00"), "MMM d")}
                                  {group.startDate !== group.endDate && ` – ${format(new Date(group.endDate + "T00:00"), "MMM d")}`}
                                  {dayCount > 1 && ` (${dayCount} days)`}
                                </p>
                              </div>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-2">
                        <Palmtree className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm text-muted-foreground">No leave this month</p>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-xs mt-1 h-auto p-0"
                        onClick={() => setShowForm(true)}
                      >
                        Request time off
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Add Leave Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-2xl shadow-2xl border p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold">Add Leave</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="rounded-xl">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Type Selection */}
                <div>
                  <Label className="text-sm mb-2 block">Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {LEAVE_TYPES.map((type) => {
                      const Icon = type.icon
                      return (
                        <button
                          key={type.value}
                          onClick={() => setFormType(type.value)}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-xl border text-sm transition-all",
                            formType === type.value
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border hover:bg-muted/50"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="leaveDate" className="text-sm">Start Date</Label>
                    <Input
                      id="leaveDate"
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="leaveEndDate" className="text-sm">End Date (optional)</Label>
                    <Input
                      id="leaveEndDate"
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="leaveNotes" className="text-sm">Notes (optional)</Label>
                  <Input
                    id="leaveNotes"
                    placeholder="Doctor appointment, vacation, etc."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                {formType === "PTO" && ptoBalance && ptoBalance.annualAllowance > 0 && (
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                    {ptoBalance.remaining} PTO day(s) remaining of {ptoBalance.annualAllowance + ptoBalance.carryover} total
                  </p>
                )}

                {submitError && (
                  <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{submitError}</p>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={!formDate || submitting}
                  className="w-full rounded-xl"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {submitting ? "Adding..." : "Add Leave"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav currentPath="/leave" />
    </motion.div>
  )
}
