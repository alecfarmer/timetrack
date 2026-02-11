"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { formatDateTime, formatDateInZone } from "@/lib/dates"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Plus,
  Filter,
  ChevronDown,
  Check,
  X,
  AlertCircle,
  History,
  MoreHorizontal,
  ArrowUpDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn, tzHeaders } from "@/lib/utils"

interface Entry {
  id: string
  type: "CLOCK_IN" | "CLOCK_OUT" | "BREAK_START" | "BREAK_END"
  timestampServer: string
  timestampClient: string
  notes: string | null
  location: {
    id: string
    name: string
    code: string
    category: string
  } | null
}

interface Correction {
  id: string
  entryId: string
  correctedBy: string
  oldTimestamp: string
  newTimestamp: string | null
  oldType: string | null
  newType: string | null
  reason: string
  status: string
  createdAt: string
}

interface Location {
  id: string
  name: string
  code: string
}

interface UserInfo {
  id: string
  email: string
  role: string
}

export default function EmployeeEntriesPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string

  const [entries, setEntries] = useState<Entry[]>([])
  const [corrections, setCorrections] = useState<Correction[]>([])
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<string>("ALL")
  const [locationFilter, setLocationFilter] = useState<string>("ALL")

  // Selection for bulk actions
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [editTimestamp, setEditTimestamp] = useState("")
  const [editType, setEditType] = useState<string>("")
  const [editLocationId, setEditLocationId] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [editReason, setEditReason] = useState("")
  const [editSaving, setEditSaving] = useState(false)

  // Add entry dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addType, setAddType] = useState<string>("CLOCK_IN")
  const [addTimestamp, setAddTimestamp] = useState("")
  const [addLocationId, setAddLocationId] = useState("")
  const [addNotes, setAddNotes] = useState("")
  const [addReason, setAddReason] = useState("")
  const [addSaving, setAddSaving] = useState(false)

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteReason, setDeleteReason] = useState("")
  const [deleting, setDeleting] = useState(false)

  // Bulk shift dialog
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false)
  const [shiftMinutes, setShiftMinutes] = useState<number>(0)
  const [shiftReason, setShiftReason] = useState("")
  const [shifting, setShifting] = useState(false)

  // History dialog
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [historyEntry, setHistoryEntry] = useState<Entry | null>(null)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ userId })
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      if (typeFilter && typeFilter !== "ALL") params.append("type", typeFilter)
      if (locationFilter && locationFilter !== "ALL") params.append("locationId", locationFilter)

      const res = await fetch(`/api/admin/entries?${params}`, {
        headers: tzHeaders(),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to fetch entries")
      }

      const data = await res.json()
      setEntries(data.entries)
      setCorrections(data.corrections || [])
      setUserInfo(data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch entries")
    } finally {
      setLoading(false)
    }
  }, [userId, startDate, endDate, typeFilter, locationFilter])

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/locations")
      if (res.ok) {
        const data = await res.json()
        setLocations(data.locations || [])
      }
    } catch {
      // Non-critical, ignore
    }
  }, [])

  useEffect(() => {
    fetchEntries()
    fetchLocations()
  }, [fetchEntries, fetchLocations])

  const formatTimestamp = (timestamp: string) => {
    return formatDateTime(timestamp)
  }

  const formatDateForInput = (timestamp: string) => {
    return formatDateInZone(timestamp, "yyyy-MM-dd'T'HH:mm")
  }

  const getEntryTypeColor = (type: string) => {
    switch (type) {
      case "CLOCK_IN": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      case "CLOCK_OUT": return "bg-rose-500/10 text-rose-600 dark:text-rose-400"
      case "BREAK_START": return "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      case "BREAK_END": return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
      default: return "bg-gray-500/10 text-gray-600"
    }
  }

  const getEntryTypeLabel = (type: string) => {
    switch (type) {
      case "CLOCK_IN": return "Clock In"
      case "CLOCK_OUT": return "Clock Out"
      case "BREAK_START": return "Break Start"
      case "BREAK_END": return "Break End"
      default: return type
    }
  }

  // Selection handlers
  const toggleEntry = (id: string) => {
    const newSelected = new Set(selectedEntries)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedEntries(newSelected)
    setSelectAll(newSelected.size === entries.length)
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedEntries(new Set())
      setSelectAll(false)
    } else {
      setSelectedEntries(new Set(entries.map(e => e.id)))
      setSelectAll(true)
    }
  }

  // Edit entry
  const openEditDialog = (entry: Entry) => {
    setEditingEntry(entry)
    setEditTimestamp(formatDateForInput(entry.timestampServer))
    setEditType(entry.type)
    setEditLocationId(entry.location?.id || "")
    setEditNotes(entry.notes || "")
    setEditReason("")
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingEntry || !editReason.trim()) return

    setEditSaving(true)
    try {
      const res = await fetch("/api/admin/entries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...tzHeaders() },
        body: JSON.stringify({
          entryId: editingEntry.id,
          timestamp: new Date(editTimestamp).toISOString(),
          type: editType,
          locationId: editLocationId || undefined,
          notes: editNotes,
          reason: editReason,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update entry")
      }

      setEditDialogOpen(false)
      await fetchEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update entry")
    } finally {
      setEditSaving(false)
    }
  }

  // Add entry
  const openAddDialog = () => {
    setAddType("CLOCK_IN")
    setAddTimestamp(formatDateForInput(new Date().toISOString()))
    setAddLocationId(locations[0]?.id || "")
    setAddNotes("")
    setAddReason("")
    setAddDialogOpen(true)
  }

  const handleAddEntry = async () => {
    if (!addReason.trim() || !addLocationId) return

    setAddSaving(true)
    try {
      const res = await fetch("/api/admin/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...tzHeaders() },
        body: JSON.stringify({
          userId,
          type: addType,
          locationId: addLocationId,
          timestamp: new Date(addTimestamp).toISOString(),
          reason: addReason,
          notes: addNotes,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create entry")
      }

      setAddDialogOpen(false)
      await fetchEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create entry")
    } finally {
      setAddSaving(false)
    }
  }

  // Delete entries
  const handleDelete = async () => {
    if (selectedEntries.size === 0 || !deleteReason.trim()) return

    setDeleting(true)
    try {
      const res = await fetch("/api/admin/entries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...tzHeaders() },
        body: JSON.stringify({
          entryIds: Array.from(selectedEntries),
          reason: deleteReason,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete entries")
      }

      setDeleteDialogOpen(false)
      setDeleteReason("")
      setSelectedEntries(new Set())
      setSelectAll(false)
      await fetchEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entries")
    } finally {
      setDeleting(false)
    }
  }

  // Bulk shift
  const handleBulkShift = async () => {
    if (selectedEntries.size === 0 || !shiftReason.trim() || shiftMinutes === 0) return

    setShifting(true)
    try {
      const res = await fetch("/api/admin/entries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...tzHeaders() },
        body: JSON.stringify({
          entryIds: Array.from(selectedEntries),
          shiftMinutes,
          reason: shiftReason,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to shift entries")
      }

      setShiftDialogOpen(false)
      setShiftMinutes(0)
      setShiftReason("")
      setSelectedEntries(new Set())
      setSelectAll(false)
      await fetchEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to shift entries")
    } finally {
      setShifting(false)
    }
  }

  // View history
  const openHistoryDialog = (entry: Entry) => {
    setHistoryEntry(entry)
    setHistoryDialogOpen(true)
  }

  const entryCorrections = historyEntry
    ? corrections.filter(c => c.entryId === historyEntry.id)
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Employee Entries</h1>
            {userInfo && (
              <p className="text-muted-foreground">
                {userInfo.email} <Badge variant="outline" className="ml-2">{userInfo.role}</Badge>
              </p>
            )}
          </div>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-2 p-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span className="text-destructive">{error}</span>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Entry Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="CLOCK_IN">Clock In</SelectItem>
                  <SelectItem value="CLOCK_OUT">Clock Out</SelectItem>
                  <SelectItem value="BREAK_START">Break Start</SelectItem>
                  <SelectItem value="BREAK_END">Break End</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => {
              setStartDate("")
              setEndDate("")
              setTypeFilter("ALL")
              setLocationFilter("ALL")
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedEntries.size > 0 && (
        <Card className="border-primary">
          <CardContent className="flex items-center justify-between p-4">
            <span className="font-medium">
              {selectedEntries.size} {selectedEntries.size === 1 ? "entry" : "entries"} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShiftDialogOpen(true)}>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Shift Time
              </Button>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Time Entries</span>
            <Badge variant="secondary">{entries.length} entries</Badge>
          </CardTitle>
          <CardDescription>
            Click on an entry to edit, or select multiple for bulk actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No entries found for this user</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Select All header */}
              <div className="flex items-center gap-4 px-4 py-2 bg-muted/50 rounded-lg">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm font-medium flex-1">Select All</span>
                <span className="text-sm text-muted-foreground">Type</span>
                <span className="text-sm text-muted-foreground w-40 text-right">Timestamp</span>
                <span className="text-sm text-muted-foreground w-32 text-right">Location</span>
                <span className="w-10"></span>
              </div>

              {/* Entry rows */}
              {entries.map((entry) => {
                const hasCorrections = corrections.some(c => c.entryId === entry.id)
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-lg border transition-colors",
                      selectedEntries.has(entry.id)
                        ? "bg-primary/5 border-primary"
                        : "hover:bg-muted/50 border-transparent"
                    )}
                  >
                    <Checkbox
                      checked={selectedEntries.has(entry.id)}
                      onCheckedChange={() => toggleEntry(entry.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className={getEntryTypeColor(entry.type)}>
                          {getEntryTypeLabel(entry.type)}
                        </Badge>
                        {hasCorrections && (
                          <Badge variant="outline" className="text-xs">
                            Edited
                          </Badge>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-sm w-40 text-right">
                      {formatTimestamp(entry.timestampServer)}
                    </div>
                    <div className="text-sm w-32 text-right text-muted-foreground truncate">
                      {entry.location?.name || "Unknown"}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(entry)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {hasCorrections && (
                          <DropdownMenuItem onClick={() => openHistoryDialog(entry)}>
                            <History className="h-4 w-4 mr-2" />
                            View History
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedEntries(new Set([entry.id]))
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Entry</DialogTitle>
            <DialogDescription>
              Make changes to this time entry. A reason is required for compliance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Entry Type</Label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLOCK_IN">Clock In</SelectItem>
                  <SelectItem value="CLOCK_OUT">Clock Out</SelectItem>
                  <SelectItem value="BREAK_START">Break Start</SelectItem>
                  <SelectItem value="BREAK_END">Break End</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timestamp</Label>
              <Input
                type="datetime-local"
                value={editTimestamp}
                onChange={(e) => setEditTimestamp(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={editLocationId} onValueChange={setEditLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-destructive">Reason for Edit *</Label>
              <Textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Required: Explain why this edit is being made"
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={editSaving || !editReason.trim()}>
              {editSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Entry Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Entry</DialogTitle>
            <DialogDescription>
              Create a new time entry for this employee. A reason is required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Entry Type</Label>
              <Select value={addType} onValueChange={setAddType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLOCK_IN">Clock In</SelectItem>
                  <SelectItem value="CLOCK_OUT">Clock Out</SelectItem>
                  <SelectItem value="BREAK_START">Break Start</SelectItem>
                  <SelectItem value="BREAK_END">Break End</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timestamp</Label>
              <Input
                type="datetime-local"
                value={addTimestamp}
                onChange={(e) => setAddTimestamp(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Location *</Label>
              <Select value={addLocationId} onValueChange={setAddLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={addNotes}
                onChange={(e) => setAddNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-destructive">Reason for Adding *</Label>
              <Textarea
                value={addReason}
                onChange={(e) => setAddReason(e.target.value)}
                placeholder="Required: Explain why this entry is being added"
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEntry} disabled={addSaving || !addReason.trim() || !addLocationId}>
              {addSaving ? "Adding..." : "Add Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedEntries.size} {selectedEntries.size === 1 ? "Entry" : "Entries"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. A record of the deletion will be kept for audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label className="text-destructive">Reason for Deletion *</Label>
            <Textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Required: Explain why these entries are being deleted"
              className="mt-2 min-h-[80px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting || !deleteReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Shift Dialog */}
      <Dialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shift Entry Times</DialogTitle>
            <DialogDescription>
              Shift the timestamp of {selectedEntries.size} selected {selectedEntries.size === 1 ? "entry" : "entries"} by a specified number of minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Time Shift (minutes)</Label>
              <Input
                type="number"
                value={shiftMinutes}
                onChange={(e) => setShiftMinutes(parseInt(e.target.value) || 0)}
                placeholder="e.g., 30 or -15"
              />
              <p className="text-xs text-muted-foreground">
                Positive values shift forward, negative values shift backward
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-destructive">Reason for Shift *</Label>
              <Textarea
                value={shiftReason}
                onChange={(e) => setShiftReason(e.target.value)}
                placeholder="Required: Explain why these times are being shifted"
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShiftDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkShift} disabled={shifting || !shiftReason.trim() || shiftMinutes === 0}>
              {shifting ? "Shifting..." : "Shift Times"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit History</DialogTitle>
            <DialogDescription>
              Changes made to this entry
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
            {entryCorrections.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No edit history</p>
            ) : (
              entryCorrections.map((correction) => (
                <div key={correction.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{correction.status}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(correction.createdAt)}
                    </span>
                  </div>
                  {correction.oldTimestamp && correction.newTimestamp && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Time: </span>
                      <span className="line-through text-muted-foreground">
                        {formatTimestamp(correction.oldTimestamp)}
                      </span>
                      <span className="mx-2">→</span>
                      <span>{formatTimestamp(correction.newTimestamp)}</span>
                    </div>
                  )}
                  {correction.oldType && correction.newType && correction.oldType !== correction.newType && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Type: </span>
                      <span className="line-through text-muted-foreground">
                        {getEntryTypeLabel(correction.oldType)}
                      </span>
                      <span className="mx-2">→</span>
                      <span>{getEntryTypeLabel(correction.newType)}</span>
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="text-muted-foreground">Reason: </span>
                    <span>{correction.reason}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
