"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WifiOff, RefreshCw, Check, AlertCircle, ChevronDown, ChevronUp, Trash2, Clock } from "lucide-react"
import { getPendingCount, getPendingEntries, syncPendingEntries, removePendingEntry } from "@/lib/offline"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/dates"

interface PendingEntry {
  id: string
  type: string
  locationId: string
  timestampClient: string
  retries: number
}

interface OfflineBannerProps {
  onSyncComplete?: () => void
}

export function OfflineBanner({ onSyncComplete }: OfflineBannerProps) {
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingEntries, setPendingEntries] = useState<PendingEntry[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ synced: number; failed: number } | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine)
    setIsOnline(navigator.onLine)
    window.addEventListener("online", updateOnline)
    window.addEventListener("offline", updateOnline)

    // Check pending count periodically
    const checkPending = async () => {
      try {
        const count = await getPendingCount()
        setPendingCount(count)
        if (count > 0 && expanded) {
          const entries = await getPendingEntries()
          setPendingEntries(entries)
        }
      } catch {}
    }
    checkPending()
    const interval = setInterval(checkPending, 5000)

    return () => {
      window.removeEventListener("online", updateOnline)
      window.removeEventListener("offline", updateOnline)
      clearInterval(interval)
    }
  }, [expanded])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      handleSync()
    }
  }, [isOnline])

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const result = await syncPendingEntries()
      setSyncResult(result)
      const count = await getPendingCount()
      setPendingCount(count)
      if (expanded) {
        const entries = await getPendingEntries()
        setPendingEntries(entries)
      }
      if (result.synced > 0) {
        onSyncComplete?.()
      }
      // Clear result after 5s
      setTimeout(() => setSyncResult(null), 5000)
    } catch {
      setSyncResult({ synced: 0, failed: pendingCount })
    }
    setSyncing(false)
  }

  const handleDiscard = async (id: string) => {
    await removePendingEntry(id)
    const count = await getPendingCount()
    setPendingCount(count)
    setPendingEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const handleDiscardAll = async () => {
    for (const entry of pendingEntries) {
      await removePendingEntry(entry.id)
    }
    setPendingCount(0)
    setPendingEntries([])
  }

  const toggleExpanded = async () => {
    if (!expanded && pendingCount > 0) {
      const entries = await getPendingEntries()
      setPendingEntries(entries)
    }
    setExpanded(!expanded)
  }

  if (pendingCount === 0 && isOnline && !syncResult) return null

  return (
    <AnimatePresence>
      {(!isOnline || pendingCount > 0 || syncResult) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={cn(
            "rounded-xl border p-3",
            !isOnline
              ? "bg-warning/10 border-warning/30"
              : syncResult?.failed
              ? "bg-destructive/10 border-destructive/30"
              : syncResult?.synced
              ? "bg-success/10 border-success/30"
              : "bg-blue-500/10 border-blue-500/30"
          )}
        >
          <div className="flex items-center gap-3">
            {!isOnline ? (
              <WifiOff className="h-5 w-5 text-warning flex-shrink-0" />
            ) : syncResult?.synced ? (
              <Check className="h-5 w-5 text-success flex-shrink-0" />
            ) : syncResult?.failed ? (
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            ) : (
              <RefreshCw className="h-5 w-5 text-blue-500 flex-shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              {!isOnline ? (
                <>
                  <p className="text-sm font-medium text-warning">You're offline</p>
                  <p className="text-xs text-warning/80">
                    {pendingCount > 0
                      ? `${pendingCount} entry${pendingCount > 1 ? "ies" : ""} queued for sync`
                      : "Clock actions will be saved locally"}
                  </p>
                </>
              ) : syncResult ? (
                <p className="text-sm font-medium">
                  {syncResult.synced > 0 && (
                    <span className="text-success">Synced {syncResult.synced} entry{syncResult.synced > 1 ? "ies" : ""}</span>
                  )}
                  {syncResult.failed > 0 && (
                    <span className="text-destructive">{syncResult.synced > 0 ? ", " : ""}{syncResult.failed} failed</span>
                  )}
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium text-blue-500">{pendingCount} pending</p>
                  <p className="text-xs text-blue-500/80">Offline entries waiting to sync</p>
                </>
              )}
            </div>

            <div className="flex items-center gap-1">
              {pendingCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleExpanded}
                  className="h-8 w-8 p-0"
                >
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              )}
              {isOnline && pendingCount > 0 && !syncResult && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex-shrink-0 gap-1"
                >
                  <RefreshCw className={cn("h-3 w-3", syncing && "animate-spin")} />
                  Sync
                </Button>
              )}
            </div>
          </div>

          {/* Expanded entry list */}
          <AnimatePresence>
            {expanded && pendingEntries.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-current/10 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Queued Entries</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                    onClick={handleDiscardAll}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Discard All
                  </Button>
                </div>
                {pendingEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-2 text-xs p-2 rounded-lg bg-background/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <Badge variant="secondary" className="text-[10px] mr-1">{entry.type.replace("_", " ")}</Badge>
                        <span className="text-muted-foreground">{formatDateTime(entry.timestampClient)}</span>
                        {entry.retries > 0 && (
                          <span className="text-muted-foreground/60 ml-1">({entry.retries} retries)</span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive flex-shrink-0"
                      onClick={() => handleDiscard(entry.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
