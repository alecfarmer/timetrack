"use client"

import { motion, AnimatePresence } from "framer-motion"
import { LocationPicker } from "@/components/location-picker"
import { LiveTimerCompact } from "@/components/dashboard/live-timer"
import { GeoPosition } from "@/lib/geo"
import { cn } from "@/lib/utils"
import { useState } from "react"
import {
  Play,
  Square,
  Coffee,
  Loader2,
  Check,
  AlertTriangle,
  MapPin,
  ChevronRight,
} from "lucide-react"

interface DesktopClockBarProps {
  clock: any
  position: GeoPosition | null
  gpsLoading: boolean
  refreshGps: () => void
  onClockIn: () => Promise<void>
  isOvertime: boolean
}

type ButtonState = "idle" | "loading" | "success" | "error"

export function DesktopClockBar({
  clock,
  position,
  gpsLoading,
  refreshGps,
  onClockIn,
  isOvertime,
}: DesktopClockBarProps) {
  const [clockState, setClockState] = useState<ButtonState>("idle")
  const [breakState, setBreakState] = useState<ButtonState>("idle")

  const sessionStart = clock.currentStatus?.currentSessionStart
    ? new Date(clock.currentStatus.currentSessionStart)
    : null
  const isClockedIn = clock.currentStatus?.isClockedIn || false
  const clockDisabled =
    !isClockedIn &&
    (!clock.selectedLocationId || !position || !clock.isWithinGeofence)

  const handleClockIn = async () => {
    if (clockState !== "idle" || clockDisabled) return
    setClockState("loading")
    try {
      await onClockIn()
      setClockState("success")
      setTimeout(() => setClockState("idle"), 1500)
    } catch {
      setClockState("error")
      setTimeout(() => setClockState("idle"), 2000)
    }
  }

  const handleClockOut = async () => {
    if (clockState !== "idle") return
    setClockState("loading")
    try {
      await clock.handleClockOut()
      setClockState("success")
      setTimeout(() => setClockState("idle"), 1500)
    } catch {
      setClockState("error")
      setTimeout(() => setClockState("idle"), 2000)
    }
  }

  const handleBreakToggle = async () => {
    if (breakState !== "idle") return
    setBreakState("loading")
    try {
      if (clock.isOnBreak) {
        await clock.handleBreakEnd()
      } else {
        await clock.handleBreakStart()
      }
      setBreakState("idle")
    } catch {
      setBreakState("error")
      setTimeout(() => setBreakState("idle"), 2000)
    }
  }

  const getStatusLabel = () => {
    if (!isClockedIn) return "Ready"
    if (clock.isOnBreak) return "On Break"
    if (isOvertime) return "Overtime"
    return "Working"
  }

  const getStatusColor = () => {
    if (!isClockedIn) return "text-muted-foreground"
    if (clock.isOnBreak) return "text-amber-500"
    if (isOvertime) return "text-red-500"
    return "text-emerald-500"
  }

  return (
    <div className="border-t border-border/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-12">
          {/* Left: Location */}
          <div className="flex-1 min-w-0">
            {!position && !gpsLoading ? (
              <button
                onClick={refreshGps}
                className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span className="font-medium">Enable Location</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            ) : gpsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Getting location...</span>
              </div>
            ) : clock.locations.length > 0 ? (
              <LocationPicker
                locations={clock.locations}
                selectedId={clock.selectedLocationId}
                userPosition={position}
                onSelect={clock.setSelectedLocationId}
                className="max-w-xs"
              />
            ) : null}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-border" />

          {/* Center: Timer + Status */}
          <div className="flex items-center gap-3">
            <LiveTimerCompact
              startTime={sessionStart}
              isOnBreak={clock.isOnBreak}
              className="text-lg"
            />
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  !isClockedIn
                    ? "bg-muted-foreground/40"
                    : clock.isOnBreak
                    ? "bg-amber-500"
                    : isOvertime
                    ? "bg-red-500 animate-pulse"
                    : "bg-emerald-500"
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  getStatusColor()
                )}
              >
                {getStatusLabel()}
              </span>
            </div>

            {isOvertime && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">
                <AlertTriangle className="h-3 w-3" />
                OT
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-border" />

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Clock In / Clock Out */}
            {!isClockedIn ? (
              <motion.button
                onClick={handleClockIn}
                disabled={clockDisabled || clockState === "loading"}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  "bg-emerald-500 text-white hover:bg-emerald-600",
                  (clockDisabled || clockState === "loading") &&
                    "opacity-50 cursor-not-allowed"
                )}
                whileTap={{ scale: 0.97 }}
              >
                <AnimatePresence mode="wait">
                  {clockState === "loading" ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    </motion.span>
                  ) : clockState === "success" ? (
                    <motion.span
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Done
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Clock In
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            ) : (
              <motion.button
                onClick={handleClockOut}
                disabled={clockState === "loading"}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
                  "hover:bg-rose-500/20",
                  clockState === "loading" && "opacity-50 cursor-not-allowed"
                )}
                whileTap={{ scale: 0.97 }}
              >
                <AnimatePresence mode="wait">
                  {clockState === "loading" ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    </motion.span>
                  ) : clockState === "success" ? (
                    <motion.span
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Done
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <Square className="h-3 w-3" />
                      Clock Out
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )}

            {/* Break button (only when clocked in) */}
            {isClockedIn && (
              <motion.button
                onClick={handleBreakToggle}
                disabled={breakState === "loading"}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                  clock.isOnBreak
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20",
                  breakState === "loading" && "opacity-50 cursor-not-allowed"
                )}
                whileTap={{ scale: 0.97 }}
              >
                {breakState === "loading" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : clock.isOnBreak ? (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    End Break
                  </>
                ) : (
                  <>
                    <Coffee className="h-3.5 w-3.5" />
                    Break
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
