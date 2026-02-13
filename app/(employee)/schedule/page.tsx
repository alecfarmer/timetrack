"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"
import { RefreshButton } from "@/components/pull-to-refresh"
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  Inbox,
  Send,
  X,
  CheckCircle2,
  Loader2,
  Hand,
} from "lucide-react"
import { format, startOfWeek, addWeeks, isToday } from "date-fns"
import { cn } from "@/lib/utils"

interface ScheduledShift {
  date: string
  dayOfWeek: string
  shiftId: string
  shiftName: string
  startTime: string
  endTime: string
  color: string
}

interface ScheduleData {
  schedule: ScheduledShift[]
  weekStart: string
  weekEnd: string
}

interface OpenShift {
  id: string
  date: string
  shift: { id: string; name: string; startTime: string; endTime: string; color: string }
  createdAt: string
}

interface SwapRequest {
  id: string
  assignmentId: string
  status: string
  reason: string | null
  createdAt: string
}

interface ShiftAssignment {
  id: string
  shiftId: string
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":")
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

function SwapStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return <Badge className="bg-yellow-500/15 text-yellow-600 border-0 text-xs">Pending</Badge>
    case "accepted":
      return <Badge className="bg-blue-500/15 text-blue-600 border-0 text-xs">Accepted</Badge>
    case "completed":
      return <Badge className="bg-green-500/15 text-green-600 border-0 text-xs">Completed</Badge>
    case "cancelled":
      return <Badge className="bg-muted text-muted-foreground border-0 text-xs">Cancelled</Badge>
    case "rejected":
      return <Badge className="bg-red-500/15 text-red-600 border-0 text-xs">Rejected</Badge>
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>
  }
}

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<ScheduledShift[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )

  // Shift swap and open shift state
  const [openShifts, setOpenShifts] = useState<OpenShift[]>([])
  const [mySwaps, setMySwaps] = useState<SwapRequest[]>([])
  const [myAssignments, setMyAssignments] = useState<ShiftAssignment[]>([])
  const [requestingSwap, setRequestingSwap] = useState<string | null>(null)
  const [swapReason, setSwapReason] = useState("")
  const [submittingSwap, setSubmittingSwap] = useState(false)
  const [claimingShift, setClaimingShift] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const newWeekStart = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset)
    setCurrentWeekStart(newWeekStart)
  }, [weekOffset])

  const showMessage = useCallback((msg: string, type: "success" | "error") => {
    if (type === "success") {
      setSuccessMessage(msg)
      setErrorMessage(null)
    } else {
      setErrorMessage(msg)
      setSuccessMessage(null)
    }
    setTimeout(() => {
      setSuccessMessage(null)
      setErrorMessage(null)
    }, 4000)
  }, [])

  const fetchSchedule = async () => {
    try {
      const res = await fetch(`/api/shifts/my-schedule?weeks=${Math.max(2, weekOffset + 2)}`)
      if (res.ok) {
        const data: ScheduleData = await res.json()
        setSchedule(data.schedule)
      }
    } catch (error) {
      console.error("Failed to fetch schedule:", error)
    }
  }

  const fetchOpenShifts = async () => {
    try {
      const res = await fetch("/api/shifts/open")
      if (res.ok) setOpenShifts(await res.json())
    } catch (error) {
      console.error("Failed to fetch open shifts:", error)
    }
  }

  const fetchSwapRequests = async () => {
    try {
      const res = await fetch("/api/shifts/swap")
      if (res.ok) setMySwaps(await res.json())
    } catch (error) {
      console.error("Failed to fetch swap requests:", error)
    }
  }

  const fetchAssignments = async () => {
    try {
      const res = await fetch("/api/shifts/assignments")
      if (res.ok) {
        const data = await res.json()
        setMyAssignments(data.map((a: { id: string; shiftId: string }) => ({ id: a.id, shiftId: a.shiftId })))
      }
    } catch (error) {
      console.error("Failed to fetch assignments:", error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchSchedule(),
        fetchOpenShifts(),
        fetchSwapRequests(),
        fetchAssignments(),
      ])
      setLoading(false)
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      fetchSchedule(),
      fetchOpenShifts(),
      fetchSwapRequests(),
      fetchAssignments(),
    ])
    setRefreshing(false)
  }

  const handleSwapRequest = async (assignmentId: string) => {
    setSubmittingSwap(true)
    try {
      const res = await fetch("/api/shifts/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, reason: swapReason || null }),
      })
      if (res.ok) {
        showMessage("Swap request submitted successfully!", "success")
        setRequestingSwap(null)
        setSwapReason("")
        await fetchSwapRequests()
      } else {
        const data = await res.json()
        showMessage(data.error || "Failed to submit swap request", "error")
      }
    } catch {
      showMessage("Failed to submit swap request", "error")
    } finally {
      setSubmittingSwap(false)
    }
  }

  const handleCancelSwap = async (swapId: string) => {
    try {
      const res = await fetch("/api/shifts/swap", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swapId, action: "cancel" }),
      })
      if (res.ok) {
        showMessage("Swap request cancelled", "success")
        await fetchSwapRequests()
      } else {
        const data = await res.json()
        showMessage(data.error || "Failed to cancel swap request", "error")
      }
    } catch {
      showMessage("Failed to cancel swap request", "error")
    }
  }

  const handleClaimShift = async (openShiftId: string) => {
    setClaimingShift(openShiftId)
    try {
      const res = await fetch("/api/shifts/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openShiftId }),
      })
      if (res.ok) {
        showMessage("Shift claimed successfully!", "success")
        await Promise.all([fetchOpenShifts(), fetchSchedule()])
      } else {
        const data = await res.json()
        showMessage(data.error || "Failed to claim shift", "error")
      }
    } catch {
      showMessage("Failed to claim shift", "error")
    } finally {
      setClaimingShift(null)
    }
  }

  // Group shifts by date
  const shiftsByDate = schedule.reduce((acc, shift) => {
    if (!acc[shift.date]) {
      acc[shift.date] = []
    }
    acc[shift.date].push(shift)
    return acc
  }, {} as Record<string, ScheduledShift[]>)

  // Generate days for current week view
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart)
    date.setDate(date.getDate() + i)
    return date
  })

  const hasShifts = schedule.length > 0
  const totalShiftsThisWeek = weekDays.reduce((count, day) => {
    const dateStr = format(day, "yyyy-MM-dd")
    return count + (shiftsByDate[dateStr]?.length || 0)
  }, 0)

  // Check if a shift already has a pending swap
  const hasPendingSwap = (shiftId: string): boolean => {
    const assignment = myAssignments.find(a => a.shiftId === shiftId)
    if (!assignment) return false
    return mySwaps.some(s => s.assignmentId === assignment.id && s.status === "pending")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading schedule...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-background">
      <PageHeader
        title="My Schedule"
        subtitle="Your shift assignments"
        actions={
          <RefreshButton onRefresh={handleRefresh} refreshing={refreshing} />
        }
      />

      {/* Toast Messages */}
      {successMessage && (
        <div className="px-4 max-w-6xl mx-auto lg:px-8 w-full">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm mt-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {successMessage}
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="px-4 max-w-6xl mx-auto lg:px-8 w-full">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm mt-2">
            <X className="h-4 w-4 shrink-0" />
            {errorMessage}
          </div>
        </div>
      )}

      {/* Week Navigation */}
      <div className="px-4 pt-4 pb-2 max-w-6xl mx-auto lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset(prev => prev - 1)}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-center">
            <p className="font-semibold">
              {format(currentWeekStart, "MMM d")} - {format(weekDays[6], "MMM d, yyyy")}
            </p>
            {weekOffset === 0 && (
              <Badge className="bg-primary/15 text-primary border-0 text-xs mt-1">This Week</Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Week Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center p-4">
            <p className="text-2xl font-bold">{totalShiftsThisWeek}</p>
            <p className="text-xs text-muted-foreground">Shifts This Week</p>
          </Card>
          <Card className="text-center p-4">
            <p className="text-2xl font-bold">{schedule.length}</p>
            <p className="text-xs text-muted-foreground">Total Scheduled</p>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 lg:pb-8">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-6">
          {/* Open Shifts Section */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Open Shifts</h3>
              {openShifts.length > 0 && (
                <Badge className="bg-primary/15 text-primary border-0 text-xs">
                  {openShifts.length} Available
                </Badge>
              )}
            </div>
            {openShifts.length > 0 ? (
              <div className="space-y-2">
                {openShifts.map((openShift) => (
                  <Card key={openShift.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-1 h-12 rounded-full shrink-0"
                        style={{ backgroundColor: openShift.shift.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{openShift.shift.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(openShift.date + "T00:00:00"), "EEE, MMM d")}</span>
                          <span className="text-muted-foreground/50">|</span>
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatTime(openShift.shift.startTime)} - {formatTime(openShift.shift.endTime)}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleClaimShift(openShift.id)}
                        disabled={claimingShift === openShift.id}
                        className="gap-1 shrink-0"
                      >
                        {claimingShift === openShift.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Hand className="h-3 w-3" />
                        )}
                        Claim
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-2">
                    <Inbox className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No open shifts available right now.</p>
                </div>
              </Card>
            )}
          </div>

          {/* My Swap Requests */}
          {mySwaps.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">My Swap Requests</h3>
              <div className="space-y-2">
                {mySwaps.map((swap) => (
                  <Card key={swap.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Swap Request</span>
                          <SwapStatusBadge status={swap.status} />
                        </div>
                        {swap.reason && (
                          <p className="text-xs text-muted-foreground mt-1 ml-6">
                            Reason: {swap.reason}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                          Submitted {format(new Date(swap.createdAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                      {swap.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelSwap(swap.id)}
                          className="text-xs text-muted-foreground hover:text-red-600 shrink-0"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Schedule */}
          {!hasShifts ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Shifts Scheduled</h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                You don&apos;t have any shifts assigned yet. Check with your manager if you&apos;re expecting to be scheduled.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {weekDays.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd")
                const dayShifts = shiftsByDate[dateStr] || []
                const today = isToday(day)

                return (
                  <Card key={dateStr} className={cn(
                    "transition-all",
                    today && "ring-2 ring-primary ring-offset-2"
                  )}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-sm font-semibold",
                            today && "text-primary"
                          )}>
                            {format(day, "EEEE")}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(day, "MMM d")}
                          </span>
                        </div>
                        {today && (
                          <Badge variant="default" className="text-xs">Today</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {dayShifts.length > 0 ? (
                        <div className="space-y-2">
                          {dayShifts.map((shift, idx) => {
                            const assignment = myAssignments.find(a => a.shiftId === shift.shiftId)
                            const pendingSwap = hasPendingSwap(shift.shiftId)
                            const isSwapFormOpen = requestingSwap === assignment?.id

                            return (
                              <div
                                key={`${shift.shiftId}-${idx}`}
                                className="rounded-lg bg-muted/50 overflow-hidden"
                                style={{ borderLeft: `4px solid ${shift.color}` }}
                              >
                                <div className="flex items-center gap-3 p-3">
                                  <div className="flex-1">
                                    <p className="font-medium">{shift.shiftName}</p>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      <span>
                                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                      </span>
                                    </div>
                                  </div>
                                  {pendingSwap ? (
                                    <Badge className="bg-yellow-500/15 text-yellow-600 border-0 text-xs">
                                      Swap Pending
                                    </Badge>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled={!assignment}
                                      onClick={() => {
                                        if (isSwapFormOpen) {
                                          setRequestingSwap(null)
                                          setSwapReason("")
                                        } else if (assignment) {
                                          setRequestingSwap(assignment.id)
                                          setSwapReason("")
                                        }
                                      }}
                                      className={cn(
                                        "gap-1 text-xs",
                                        !assignment && "opacity-50",
                                        isSwapFormOpen && "bg-muted"
                                      )}
                                      title={!assignment ? "No assignment found for this shift" : "Request a shift swap"}
                                    >
                                      <ArrowLeftRight className="h-3 w-3" />
                                      Swap
                                    </Button>
                                  )}
                                </div>

                                {/* Inline Swap Form */}
                                {isSwapFormOpen && assignment && (
                                  <div className="px-3 pb-3 border-t border-border/50">
                                    <div className="pt-3 space-y-2">
                                      <p className="text-xs text-muted-foreground">
                                        Why do you want to swap this shift? (optional)
                                      </p>
                                      <Input
                                        placeholder="e.g. Doctor appointment, family event..."
                                        value={swapReason}
                                        onChange={(e) => setSwapReason(e.target.value)}
                                        className="text-sm"
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            handleSwapRequest(assignment.id)
                                          }
                                        }}
                                      />
                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => handleSwapRequest(assignment.id)}
                                          disabled={submittingSwap}
                                          className="gap-1 text-xs"
                                        >
                                          {submittingSwap ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <Send className="h-3 w-3" />
                                          )}
                                          Submit Request
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setRequestingSwap(null)
                                            setSwapReason("")
                                          }}
                                          className="text-xs"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground py-2">No shifts scheduled</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
