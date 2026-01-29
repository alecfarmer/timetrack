"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WifiOff, RefreshCw, Check, AlertCircle } from "lucide-react"
import { getPendingCount, syncPendingEntries } from "@/lib/offline"
import { cn } from "@/lib/utils"

interface OfflineBannerProps {
  onSyncComplete?: () => void
}

export function OfflineBanner({ onSyncComplete }: OfflineBannerProps) {
  const [pendingCount, setPendingCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ synced: number; failed: number } | null>(null)

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
      } catch {}
    }
    checkPending()
    const interval = setInterval(checkPending, 5000)

    return () => {
      window.removeEventListener("online", updateOnline)
      window.removeEventListener("offline", updateOnline)
      clearInterval(interval)
    }
  }, [])

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
        </motion.div>
      )}
    </AnimatePresence>
  )
}
