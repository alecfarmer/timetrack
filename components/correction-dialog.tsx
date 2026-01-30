"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"
import { formatDateTime } from "@/lib/dates"

interface Correction {
  id: string
  fieldChanged: string
  oldValue: string | null
  newValue: string | null
  reason: string
  createdAt: string
}

interface CorrectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entryId: string
  entryType: string
  entryTimestamp: string
  locationName: string
}

const FIELD_OPTIONS = [
  { value: "timestampClient", label: "Timestamp" },
  { value: "type", label: "Entry Type" },
  { value: "notes", label: "Notes" },
]

export function CorrectionDialog({
  open,
  onOpenChange,
  entryId,
  entryType,
  entryTimestamp,
  locationName,
}: CorrectionDialogProps) {
  const [field, setField] = useState("")
  const [newValue, setNewValue] = useState("")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [corrections, setCorrections] = useState<Correction[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (open && entryId) {
      setLoadingHistory(true)
      fetch(`/api/entries/corrections?entryId=${entryId}`)
        .then((r) => r.ok ? r.json() : [])
        .then((data) => setCorrections(Array.isArray(data) ? data : []))
        .catch(() => setCorrections([]))
        .finally(() => setLoadingHistory(false))
    }
  }, [open, entryId])

  const handleSubmit = async () => {
    if (!field || !newValue || !reason) {
      setError("All fields are required")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/entries/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId, field, newValue, reason }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to submit correction")
      }

      const correction = await res.json()
      setCorrections((prev) => [correction, ...prev])
      setSuccess(true)
      setField("")
      setNewValue("")
      setReason("")
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit correction")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Correction</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
            <Badge variant="secondary" className="text-xs">{entryType.replace("_", " ")}</Badge>
            <span>{formatDateTime(entryTimestamp)}</span>
          </div>
          <p className="text-xs text-muted-foreground">{locationName}</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Field Selection */}
          <div className="space-y-2">
            <Label>Field to Correct</Label>
            <Select value={field} onValueChange={setField}>
              <SelectTrigger>
                <SelectValue placeholder="Select field..." />
              </SelectTrigger>
              <SelectContent>
                {FIELD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* New Value */}
          <div className="space-y-2">
            <Label>New Value</Label>
            {field === "type" ? (
              <Select value={newValue} onValueChange={setNewValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLOCK_IN">Clock In</SelectItem>
                  <SelectItem value="CLOCK_OUT">Clock Out</SelectItem>
                  <SelectItem value="BREAK_START">Break Start</SelectItem>
                  <SelectItem value="BREAK_END">Break End</SelectItem>
                </SelectContent>
              </Select>
            ) : field === "timestampClient" ? (
              <Input
                type="datetime-local"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
            ) : (
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Enter new value..."
              />
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason for Correction</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why does this need to be corrected?"
              rows={3}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              Correction submitted successfully
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !field || !newValue || !reason}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit Correction
          </Button>
        </DialogFooter>

        {/* Correction History */}
        {(corrections.length > 0 || loadingHistory) && (
          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-semibold mb-3">Correction History</h4>
            {loadingHistory ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading...
              </div>
            ) : (
              <div className="space-y-2">
                {corrections.map((c) => (
                  <div key={c.id} className="text-xs p-2 rounded-lg bg-muted/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px]">{c.fieldChanged}</Badge>
                      <span className="text-muted-foreground">{formatDateTime(c.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground line-through">{c.oldValue || "—"}</span>
                      <span>→</span>
                      <span className="font-medium">{c.newValue || "—"}</span>
                    </div>
                    <p className="text-muted-foreground">{c.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
