"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

interface NotesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entryId: string
  currentNotes?: string | null
  onNotesUpdated?: () => void
}

export function NotesDialog({
  open,
  onOpenChange,
  entryId,
  currentNotes,
  onNotesUpdated,
}: NotesDialogProps) {
  const [notes, setNotes] = useState(currentNotes || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setNotes(currentNotes || "")
      setError(null)
      setSuccess(false)
    }
  }, [open, currentNotes])

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes.trim() || null }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save notes")
      }

      setSuccess(true)
      onNotesUpdated?.()
      setTimeout(() => {
        onOpenChange(false)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save notes")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{currentNotes ? "Edit Note" : "Add Note"}</DialogTitle>
          <DialogDescription>
            Add a note to this time entry. Notes are visible to you and your admin.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Worked from home, Client meeting, Equipment issue..."
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {notes.length}/500 characters
            </p>
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
              Note saved successfully
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
