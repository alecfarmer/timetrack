"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/bottom-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  CalendarClock,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  UserPlus,
  UserMinus,
  Edit2,
  X,
  Check,
  AlertCircle,
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

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function ShiftsPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [shifts, setShifts] = useState<Shift[]>([])
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const fetchData = useCallback(async () => {
    try {
      const [shiftsRes, assignmentsRes, membersRes] = await Promise.all([
        fetch("/api/shifts"),
        fetch("/api/shifts/assignments"),
        fetch("/api/org/members"),
      ])
      if (shiftsRes.ok) setShifts(await shiftsRes.json())
      if (assignmentsRes.ok) setAssignments(await assignmentsRes.json())
      if (membersRes.ok) setMembers(await membersRes.json())
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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <motion.div className="flex flex-col min-h-screen bg-background" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="sticky top-0 z-50 glass border-b lg:ml-64">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => router.push("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CalendarClock className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Shift Scheduling</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              New Shift
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 lg:pb-8 lg:ml-64">
        <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive flex-1">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>Dismiss</Button>
            </div>
          )}

          {/* Create Shift Form */}
          {showCreate && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center justify-between">
                  <span>Create Shift</span>
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
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <CalendarClock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
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
                  <Card key={shift.id} className="border-0 shadow-lg">
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
                                <p className="text-sm text-muted-foreground">
                                  {shift.startTime.slice(0, 5)} – {shift.endTime.slice(0, 5)}
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
                              <p className="text-xs text-muted-foreground font-medium">
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
        </div>
      </main>

      <BottomNav currentPath="/admin" />
    </motion.div>
  )
}
