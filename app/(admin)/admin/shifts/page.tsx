"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { RefreshButton } from "@/components/pull-to-refresh"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  CalendarClock,
  Loader2,
  Plus,
  Trash2,
  UserPlus,
  UserMinus,
  Edit2,
  X,
  Check,
  AlertCircle,
  Users,
  Clock,
  Calendar,
  ArrowRightLeft,
  Send,
} from "lucide-react"

interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  daysOfWeek: number[]
  color: string
  isActive: boolean
}

interface ShiftAssignment {
  id: string
  shiftId: string
  userId: string
  effectiveDate: string
  endDate: string | null
  shift?: Shift
}

interface Member {
  id: string
  userId: string
  email?: string | null
  role: string
}

interface SwapRequest {
  id: string
  requesterId: string
  assignmentId: string
  targetUserId: string | null
  status: string
  reason: string | null
  createdAt: string
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function ShiftsPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [shifts, setShifts] = useState<Shift[]>([])
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Tabs
  const [activeTab, setActiveTab] = useState<"shifts" | "swaps">("shifts")

  // Create shift form
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newStart, setNewStart] = useState("09:00")
  const [newEnd, setNewEnd] = useState("17:00")
  const [newDays, setNewDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [newColor, setNewColor] = useState("#3b82f6")
  const [creating, setCreating] = useState(false)

  // Edit shift
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editStart, setEditStart] = useState("")
  const [editEnd, setEditEnd] = useState("")
  const [editDays, setEditDays] = useState<number[]>([])
  const [editColor, setEditColor] = useState("")

  // Assign member
  const [assigningShiftId, setAssigningShiftId] = useState<string | null>(null)
  const [assignUserId, setAssignUserId] = useState("")

  // Post open shift form
  const [showPostOpen, setShowPostOpen] = useState(false)
  const [openShiftId, setOpenShiftId] = useState("")
  const [openShiftDate, setOpenShiftDate] = useState("")
  const [postingOpen, setPostingOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [shiftsRes, assignmentsRes, membersRes, swapsRes] = await Promise.all([
        fetch("/api/shifts"),
        fetch("/api/shifts/assignments"),
        fetch("/api/org/members"),
        fetch("/api/admin/shifts/swaps").catch(() => null),
      ])
      if (shiftsRes.ok) setShifts(await shiftsRes.json())
      if (assignmentsRes.ok) setAssignments(await assignmentsRes.json())
      if (membersRes.ok) setMembers(await membersRes.json())
      if (swapsRes && swapsRes.ok) setSwapRequests(await swapsRes.json())
    } catch {
      setError("Failed to load shift data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/")
      return
    }
    if (!authLoading && isAdmin) {
      fetchData()
    }
  }, [authLoading, isAdmin, router, fetchData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const handleCreateShift = async () => {
    if (!newName.trim()) return
    setCreating(true)
    setError(null)
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          startTime: newStart,
          endTime: newEnd,
          daysOfWeek: newDays,
          color: newColor,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create shift")
      }
      setShowCreate(false)
      setNewName("")
      setNewStart("09:00")
      setNewEnd("17:00")
      setNewDays([1, 2, 3, 4, 5])
      setNewColor("#3b82f6")
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create shift")
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateShift = async (id: string) => {
    setError(null)
    try {
      const res = await fetch("/api/shifts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: editName,
          startTime: editStart,
          endTime: editEnd,
          daysOfWeek: editDays,
          color: editColor,
        }),
      })
      if (!res.ok) throw new Error("Failed to update shift")
      setEditingId(null)
      await fetchData()
    } catch {
      setError("Failed to update shift")
    }
  }

  const handleDeleteShift = async (id: string) => {
    if (!confirm("Delete this shift? All assignments will be removed.")) return
    try {
      const res = await fetch(`/api/shifts?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete shift")
      await fetchData()
    } catch {
      setError("Failed to delete shift")
    }
  }

  const handleAssign = async (shiftId: string) => {
    if (!assignUserId) return
    setError(null)
    try {
      const res = await fetch("/api/shifts/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftId, userId: assignUserId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to assign member")
      }
      setAssigningShiftId(null)
      setAssignUserId("")
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign member")
    }
  }

  const handleUnassign = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/shifts/assignments?id=${assignmentId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to remove assignment")
      await fetchData()
    } catch {
      setError("Failed to remove assignment")
    }
  }

  const handleSwapAction = async (swapId: string, action: "approve" | "reject") => {
    setError(null)
    try {
      const res = await fetch("/api/admin/shifts/swaps", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swapId, action: action === "approve" ? "approved" : "rejected" }),
      })
      if (!res.ok) throw new Error(`Failed to ${action} swap request`)
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} swap request`)
    }
  }

  const handlePostOpenShift = async () => {
    if (!openShiftId || !openShiftDate) return
    setPostingOpen(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/shifts/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftId: openShiftId, date: openShiftDate }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to post open shift")
      }
      setShowPostOpen(false)
      setOpenShiftId("")
      setOpenShiftDate("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post open shift")
    } finally {
      setPostingOpen(false)
    }
  }

  const startEdit = (shift: Shift) => {
    setEditingId(shift.id)
    setEditName(shift.name)
    setEditStart(shift.startTime)
    setEditEnd(shift.endTime)
    setEditDays(shift.daysOfWeek)
    setEditColor(shift.color)
  }

  const toggleDay = (days: number[], day: number, setter: (d: number[]) => void) => {
    setter(days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort())
  }

  const getShiftAssignments = (shiftId: string) =>
    assignments.filter((a) => a.shiftId === shiftId && !a.endDate)

  const getMemberEmail = (userId: string) => {
    const m = members.find((m) => m.userId === userId)
    return m?.email || `${userId.slice(0, 8)}...`
  }

  const getUnassignedMembers = (shiftId: string) => {
    const assigned = new Set(getShiftAssignments(shiftId).map((a) => a.userId))
    return members.filter((m) => !assigned.has(m.userId))
  }

  // Calculate stats
  const activeShifts = shifts.filter((s) => s.isActive).length
  const totalAssignments = assignments.filter((a) => !a.endDate).length
  const unassignedMembers = members.filter((m) => !assignments.some((a) => a.userId === m.userId && !a.endDate)).length
  const pendingSwaps = swapRequests.filter((s) => s.status === "PENDING").length

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
          <p className="text-muted-foreground font-medium">Loading shifts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader
        title="Shift Scheduling"
        subtitle="Manage work schedules"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Shift</span>
            </Button>
            <RefreshButton onRefresh={handleRefresh} refreshing={refreshing} />
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 lg:px-8 max-w-6xl mx-auto pt-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{shifts.length}</p>
          <p className="text-xs text-muted-foreground">Total Shifts</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{activeShifts}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{totalAssignments}</p>
          <p className="text-xs text-muted-foreground">Assigned</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{unassignedMembers}</p>
          <p className="text-xs text-muted-foreground">Unassigned</p>
        </Card>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-2 px-4 lg:px-8 max-w-6xl mx-auto pt-4 w-full">
        <Button
          variant={activeTab === "shifts" ? "default" : "outline"}
          size="sm"
          className="gap-1.5"
          onClick={() => setActiveTab("shifts")}
        >
          <CalendarClock className="h-4 w-4" />
          Shifts
        </Button>
        <Button
          variant={activeTab === "swaps" ? "default" : "outline"}
          size="sm"
          className="gap-1.5"
          onClick={() => setActiveTab("swaps")}
        >
          <ArrowRightLeft className="h-4 w-4" />
          Swap Requests
          {pendingSwaps > 0 && (
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
              {pendingSwaps}
            </Badge>
          )}
        </Button>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 lg:pb-8 pt-4">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive flex-1">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>Dismiss</Button>
            </div>
          )}

          {activeTab === "shifts" && (
            <>
              {/* Post Open Shift Button */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setShowPostOpen(!showPostOpen)}
                >
                  <Send className="h-4 w-4" />
                  Post Open Shift
                </Button>
              </div>

              {/* Post Open Shift Form */}
              {showPostOpen && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Send className="h-5 w-5 text-primary" />
                        Post Open Shift
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPostOpen(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Shift</Label>
                      <select
                        className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                        value={openShiftId}
                        onChange={(e) => setOpenShiftId(e.target.value)}
                      >
                        <option value="">Select a shift...</option>
                        {shifts.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Date</Label>
                      <Input
                        type="date"
                        value={openShiftDate}
                        onChange={(e) => setOpenShiftDate(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <Button
                      className="w-full rounded-xl"
                      onClick={handlePostOpenShift}
                      disabled={postingOpen || !openShiftId || !openShiftDate}
                    >
                      {postingOpen ? "Posting..." : "Post Open Shift"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Create Shift Form */}
              {showCreate && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary" />
                        Create Shift
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowCreate(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label className="text-xs">Shift Name</Label>
                        <Input
                          placeholder="e.g. Morning Shift"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Start Time</Label>
                        <Input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">End Time</Label>
                        <Input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Days of Week</Label>
                      <div className="flex gap-1">
                        {DAY_NAMES.map((name, i) => (
                          <button
                            key={i}
                            onClick={() => toggleDay(newDays, i, setNewDays)}
                            className={`w-10 h-10 rounded-lg text-xs font-medium transition-colors ${
                              newDays.includes(i)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-xs">Color</Label>
                      <input
                        type="color"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0"
                      />
                    </div>
                    <Button className="w-full rounded-xl" onClick={handleCreateShift} disabled={creating || !newName.trim()}>
                      {creating ? "Creating..." : "Create Shift"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Shifts List */}
              {shifts.length === 0 && !showCreate ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                      <CalendarClock className="h-8 w-8 text-indigo-500" />
                    </div>
                    <p className="text-lg font-medium mb-1">No shifts configured</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create shifts to define work schedules and assign team members.
                    </p>
                    <Button className="rounded-xl gap-2" onClick={() => setShowCreate(true)}>
                      <Plus className="h-4 w-4" />
                      Create First Shift
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {shifts.map((shift) => {
                    const shiftAssignments = getShiftAssignments(shift.id)
                    const isEditing = editingId === shift.id
                    const isAssigning = assigningShiftId === shift.id

                    return (
                      <Card key={shift.id}>
                        <CardContent className="p-4 space-y-3">
                          {isEditing ? (
                            <div className="space-y-3">
                              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-xl font-medium" />
                              <div className="grid grid-cols-2 gap-3">
                                <Input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="rounded-xl" />
                                <Input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} className="rounded-xl" />
                              </div>
                              <div className="flex gap-1">
                                {DAY_NAMES.map((name, i) => (
                                  <button
                                    key={i}
                                    onClick={() => toggleDay(editDays, i, setEditDays)}
                                    className={`w-10 h-10 rounded-lg text-xs font-medium transition-colors ${
                                      editDays.includes(i)
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {name}
                                  </button>
                                ))}
                              </div>
                              <div className="flex items-center gap-3">
                                <input
                                  type="color"
                                  value={editColor}
                                  onChange={(e) => setEditColor(e.target.value)}
                                  className="w-8 h-8 rounded cursor-pointer border-0"
                                />
                                <div className="flex-1" />
                                <Button size="sm" className="rounded-xl gap-1" onClick={() => handleUpdateShift(shift.id)}>
                                  <Check className="h-3.5 w-3.5" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEditingId(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-3 h-8 rounded-full" style={{ backgroundColor: shift.color }} />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{shift.name}</p>
                                      {!shift.isActive && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                                    </div>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {shift.startTime.slice(0, 5)} - {shift.endTime.slice(0, 5)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(shift)}>
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteShift(shift.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex gap-1">
                                {DAY_NAMES.map((name, i) => (
                                  <span
                                    key={i}
                                    className={`w-8 h-6 flex items-center justify-center rounded text-[10px] font-medium ${
                                      shift.daysOfWeek.includes(i)
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted/50 text-muted-foreground/40"
                                    }`}
                                  >
                                    {name}
                                  </span>
                                ))}
                              </div>

                              {/* Assignments */}
                              <div className="border-t pt-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    Assigned ({shiftAssignments.length})
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 gap-1 text-xs"
                                    onClick={() => {
                                      setAssigningShiftId(isAssigning ? null : shift.id)
                                      setAssignUserId("")
                                    }}
                                  >
                                    <UserPlus className="h-3.5 w-3.5" />
                                    Assign
                                  </Button>
                                </div>

                                {isAssigning && (
                                  <div className="flex gap-2">
                                    <select
                                      className="flex-1 rounded-xl border bg-background px-3 py-1.5 text-sm"
                                      value={assignUserId}
                                      onChange={(e) => setAssignUserId(e.target.value)}
                                    >
                                      <option value="">Select member...</option>
                                      {getUnassignedMembers(shift.id).map((m) => (
                                        <option key={m.userId} value={m.userId}>
                                          {m.email || m.userId.slice(0, 8)}
                                        </option>
                                      ))}
                                    </select>
                                    <Button
                                      size="sm"
                                      className="rounded-xl"
                                      onClick={() => handleAssign(shift.id)}
                                      disabled={!assignUserId}
                                    >
                                      Add
                                    </Button>
                                  </div>
                                )}

                                {shiftAssignments.length > 0 ? (
                                  <div className="space-y-1">
                                    {shiftAssignments.map((a) => (
                                      <div key={a.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                        <p className="text-sm">{getMemberEmail(a.userId)}</p>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-destructive hover:text-destructive"
                                          onClick={() => handleUnassign(a.id)}
                                        >
                                          <UserMinus className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">No members assigned</p>
                                )}
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === "swaps" && (
            <>
              {swapRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                      <ArrowRightLeft className="h-8 w-8 text-indigo-500" />
                    </div>
                    <p className="text-lg font-medium mb-1">No swap requests</p>
                    <p className="text-sm text-muted-foreground">
                      Swap requests from team members will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {swapRequests.map((swap) => (
                    <Card key={swap.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">
                              {getMemberEmail(swap.requesterId)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {swap.targetUserId
                                ? `Swap with ${getMemberEmail(swap.targetUserId)}`
                                : "Open swap request"}
                            </p>
                            {swap.reason && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Reason: {swap.reason}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(swap.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {(swap.status === "pending" || swap.status === "accepted") ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-destructive hover:text-destructive"
                                  onClick={() => handleSwapAction(swap.id, "reject")}
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => handleSwapAction(swap.id, "approve")}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Approve
                                </Button>
                              </>
                            ) : (
                              <Badge
                                variant={swap.status === "completed" ? "default" : swap.status === "rejected" ? "destructive" : "secondary"}
                              >
                                {swap.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
