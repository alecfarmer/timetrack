"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GeoPosition, calculateDistance, formatDistance } from "@/lib/geo"
import { cn } from "@/lib/utils"
import { useTimer } from "@/hooks/use-timer"
import { useLiveXP } from "@/contexts/realtime-context"
import {
  Play,
  Square,
  Coffee,
  Loader2,
  Check,
  AlertTriangle,
  MapPin,
  ChevronDown,
  Building2,
  Home,
  CheckCircle2,
  Zap,
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

// Compact inline location picker for the header bar
function CompactLocationPicker({
  locations,
  selectedId,
  userPosition,
  onSelect,
}: {
  locations: { id: string; name: string; category?: string; latitude: number; longitude: number; geofenceRadius: number }[]
  selectedId: string
  userPosition: GeoPosition | null
  onSelect: (id: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const locationsWithDistance = useMemo(() => {
    if (!userPosition) return locations.map(l => ({ ...l, distance: undefined, isWithinGeofence: false }))
    return locations
      .map((loc) => {
        const distance = calculateDistance(
          userPosition.latitude, userPosition.longitude,
          loc.latitude, loc.longitude
        )
        return { ...loc, distance, isWithinGeofence: distance <= Math.max(loc.geofenceRadius, 200) }
      })
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
  }, [locations, userPosition])

  const selected = locationsWithDistance.find(l => l.id === selectedId) || locationsWithDistance[0]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const Icon = selected?.category === "HOME" ? Home : Building2

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors",
          "hover:bg-muted",
          isOpen && "bg-muted"
        )}
      >
        <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <span className="font-medium truncate max-w-[160px]">{selected?.name || "Select location"}</span>
        {selected?.isWithinGeofence && (
          <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
        )}
        <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 mt-1 min-w-[240px] bg-card border rounded-xl shadow-xl overflow-hidden z-50"
          >
            <div className="py-1 max-h-[280px] overflow-y-auto">
              {locationsWithDistance.map((loc) => {
                const LocIcon = loc.category === "HOME" ? Home : Building2
                return (
                  <button
                    key={loc.id}
                    onClick={() => { onSelect(loc.id); setIsOpen(false) }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                      "hover:bg-muted/50",
                      loc.id === selectedId && "bg-primary/5"
                    )}
                  >
                    <LocIcon className={cn(
                      "h-3.5 w-3.5 flex-shrink-0",
                      loc.isWithinGeofence ? "text-emerald-500" : "text-muted-foreground"
                    )} />
                    <span className={cn("font-medium truncate flex-1 text-left", loc.id === selectedId && "text-primary")}>
                      {loc.name}
                    </span>
                    {loc.distance !== undefined && (
                      <span className={cn(
                        "text-xs flex-shrink-0",
                        loc.isWithinGeofence ? "text-emerald-500" : "text-muted-foreground"
                      )}>
                        {formatDistance(loc.distance)}
                      </span>
                    )}
                    {loc.id === selectedId && (
                      <Check className="h-3 w-3 text-primary flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

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
  const { sessionXP } = useLiveXP()

  const sessionStart = clock.currentStatus?.currentSessionStart
    ? new Date(clock.currentStatus.currentSessionStart)
    : null
  const isClockedIn = clock.currentStatus?.isClockedIn || false
  const clockDisabled =
    !isClockedIn &&
    (!clock.selectedLocationId || !position || !clock.isWithinGeofence)

  // Live timer for progress calculation
  const { seconds: totalSeconds } = useTimer(sessionStart)
  const targetSeconds = 8 * 60 * 60
  const progress = useMemo(() => {
    if (!sessionStart || totalSeconds === 0) return 0
    return Math.min(100, (totalSeconds / targetSeconds) * 100)
  }, [totalSeconds, targetSeconds, sessionStart])

  // Live XP from timer (1 XP per minute)
  const liveXP = sessionStart && !clock.isOnBreak ? Math.floor(totalSeconds / 60) : 0

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

  const getProgressColor = () => {
    if (clock.isOnBreak) return "bg-amber-500"
    if (progress >= 100) return "bg-emerald-500"
    if (progress >= 75) return "bg-blue-500"
    return "bg-primary"
  }

  const { formatted } = useTimer(sessionStart)

  return (
    <div className="border-t border-border/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 h-12">
          {/* Left: Location */}
          <div className="flex-shrink-0">
            {!position && !gpsLoading ? (
              <button
                onClick={refreshGps}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span className="font-medium">Enable Location</span>
              </button>
            ) : gpsLoading ? (
              <div className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-muted-foreground">
                <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Locating...</span>
              </div>
            ) : clock.locations.length > 0 ? (
              <CompactLocationPicker
                locations={clock.locations}
                selectedId={clock.selectedLocationId}
                userPosition={position}
                onSelect={clock.setSelectedLocationId}
              />
            ) : null}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-border flex-shrink-0" />

          {/* Center: Timer + Status + Progress */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Timer */}
            <div className="flex items-center gap-2">
              {clock.isOnBreak && <Coffee className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
              <span
                className={cn(
                  "font-mono font-semibold tabular-nums text-lg",
                  !sessionStart && "text-muted-foreground/50",
                  clock.isOnBreak && "text-amber-500"
                )}
              >
                {sessionStart ? formatted : "00:00:00"}
              </span>
            </div>

            {/* Status dot + label */}
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full flex-shrink-0",
                  !isClockedIn
                    ? "bg-muted-foreground/40"
                    : clock.isOnBreak
                    ? "bg-amber-500"
                    : isOvertime
                    ? "bg-red-500 animate-pulse"
                    : "bg-emerald-500"
                )}
              />
              <span className={cn("text-sm font-medium", getStatusColor())}>
                {getStatusLabel()}
              </span>
            </div>

            {/* 8h progress bar */}
            {isClockedIn && (
              <div className="flex items-center gap-2 flex-1 min-w-0 max-w-[180px]">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full transition-colors duration-500", getProgressColor())}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, progress)}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground flex-shrink-0">
                  {progress >= 100 ? (
                    <span className="text-emerald-500 font-medium">8h done</span>
                  ) : (
                    `${Math.round(progress)}%`
                  )}
                </span>
              </div>
            )}

            {/* OT badge */}
            {isOvertime && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium flex-shrink-0">
                <AlertTriangle className="h-3 w-3" />
                OT
              </span>
            )}

            {/* Live XP */}
            {isClockedIn && (liveXP > 0 || sessionXP > 0) && (
              <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-500 flex-shrink-0">
                <Zap className="h-3 w-3" />
                +{Math.max(liveXP, sessionXP)} XP
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-border flex-shrink-0" />

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
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
                    <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    </motion.span>
                  ) : clockState === "success" ? (
                    <motion.span key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5" />
                      Done
                    </motion.span>
                  ) : (
                    <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
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
                    <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    </motion.span>
                  ) : clockState === "success" ? (
                    <motion.span key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5" />
                      Done
                    </motion.span>
                  ) : (
                    <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                      <Square className="h-3 w-3" />
                      Clock Out
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )}

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
