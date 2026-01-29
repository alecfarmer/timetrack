"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { Trash2, AlertTriangle, Loader2 } from "lucide-react"

export function DangerZone() {
  const router = useRouter()
  const { signOut } = useAuth()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch("/api/account", { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete account")
      }
      await signOut()
      router.push("/login")
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Something went wrong")
      setDeleting(false)
    }
  }

  return (
    <Card className="border-destructive/30 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!deleteConfirmOpen ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button
              variant="outline"
              className="w-full border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-xl gap-2"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm text-destructive">This will permanently delete:</p>
                  <ul className="text-sm text-destructive/80 mt-1 space-y-0.5 list-disc list-inside">
                    <li>All your time entries and clock history</li>
                    <li>All your workday records and reports</li>
                    <li>All your locations including WFH</li>
                    <li>All your callout records</li>
                  </ul>
                  <p className="text-sm text-destructive font-medium mt-2">This cannot be undone.</p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="deleteConfirm" className="text-sm">
                Type <span className="font-mono font-bold">DELETE</span> to confirm
              </Label>
              <Input
                id="deleteConfirm"
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="mt-1.5 border-destructive/30 focus-visible:ring-destructive"
              />
            </div>

            {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => { setDeleteConfirmOpen(false); setDeleteConfirmText(""); setDeleteError(null) }}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl gap-2"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || deleting}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {deleting ? "Deleting..." : "Delete My Account"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
