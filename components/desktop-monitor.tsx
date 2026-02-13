"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence, useDragControls } from "framer-motion"
import {
  Clock,
  MapPin,
  Minimize2,
  Maximize2,
  X,
  GripVertical,
  Play,
  Square,
  ChevronUp,
  ChevronDown,
  Timer,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatTime } from "@/lib/dates"

interface DesktopMonitorProps {
  isVisible: boolean
  onClose: () => void
  isClockedIn: boolean
  clockInTime?: Date | null
  currentLocation?: string | null
  locationCategory?: string | null
  onClockIn?: () => void
  onClockOut?: () => void
  weeklyProgress?: {
    daysWorked: number
    requiredDays: number
  }
}

type WidgetSize = "expanded" | "collapsed" | "minimized"

export function DesktopMonitor({
  isVisible,
  onClose,
  isClockedIn,
  clockInTime,
  currentLocation,
  locationCategory,
  onClockIn,
  onClockOut,
  weeklyProgress = { daysWorked: 0, requiredDays: 3 },
}: DesktopMonitorProps) {
  const [size, setSize] = useState<WidgetSize>("collapsed")
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [elapsedTime, setElapsedTime] = useState("00:00:00")
  const [isDragging, setIsDragging] = useState(false)
  const dragControls = useDragControls()

  // Calculate elapsed time
  useEffect(() => {
    if (!isClockedIn || !clockInTime) {
      setElapsedTime("00:00:00")
      return
    }

    const updateTimer = () => {
      const now = new Date()
      const diff = now.getTime() - new Date(clockInTime).getTime()
      const hours = Math.floor(diff / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setElapsedTime(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      )
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [isClockedIn, clockInTime])

  // Load saved position
  useEffect(() => {
    const savedPosition = localStorage.getItem("monitor-position")
    const savedSize = localStorage.getItem("monitor-size") as WidgetSize | null
    if (savedPosition) {
      try {
        setPosition(JSON.parse(savedPosition))
      } catch {
        // Use default position
      }
    }
    if (savedSize) {
      setSize(savedSize)
    }
  }, [])

  // Save position
  const handleDragEnd = useCallback(
    (_: unknown, info: { point: { x: number; y: number } }) => {
      const newPosition = {
        x: Math.max(0, Math.min(window.innerWidth - 200, info.point.x)),
        y: Math.max(0, Math.min(window.innerHeight - 100, info.point.y)),
      }
      setPosition(newPosition)
      localStorage.setItem("monitor-position", JSON.stringify(newPosition))
      setIsDragging(false)
    },
    []
  )

  const cycleSize = () => {
    const sizes: WidgetSize[] = ["expanded", "collapsed", "minimized"]
    const currentIndex = sizes.indexOf(size)
    const newSize = sizes[(currentIndex + 1) % sizes.length]
    setSize(newSize)
    localStorage.setItem("monitor-size", newSize)
  }

  const isCompliant = weeklyProgress.daysWorked >= weeklyProgress.requiredDays

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        style={{
          position: "fixed",
          right: position.x,
          bottom: position.y,
          zIndex: 9999,
        }}
        className={`
          bg-card border rounded-xl overflow-hidden
          ${isDragging ? "cursor-grabbing" : ""}
          ${size === "minimized" ? "rounded-full" : ""}
        `}
      >
        {/* Minimized State - Just a floating button */}
        {size === "minimized" && (
          <motion.button
            onClick={cycleSize}
            className={`
              w-14 h-14 flex items-center justify-center
              ${isClockedIn ? "bg-success/10" : "bg-muted"}
              hover:bg-accent transition-colors
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative">
              <Clock
                className={`w-6 h-6 ${
                  isClockedIn ? "text-success" : "text-muted-foreground"
                }`}
              />
              {isClockedIn && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse" />
              )}
            </div>
          </motion.button>
        )}

        {/* Collapsed State - Compact info */}
        {size === "collapsed" && (
          <div className="w-[220px]">
            {/* Drag Handle */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex items-center justify-between px-3 py-2 bg-muted/50 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  KPR
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={cycleSize}
                >
                  <Maximize2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={onClose}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3">
              {/* Status & Timer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`status-indicator ${
                      isClockedIn ? "status-online" : "status-offline"
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {isClockedIn ? "On-Site" : "Off-Site"}
                  </span>
                </div>
                {isClockedIn && (
                  <span className="text-lg font-mono font-bold tabular-nums text-success">
                    {elapsedTime}
                  </span>
                )}
              </div>

              {/* Location */}
              {currentLocation && isClockedIn && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{currentLocation}</span>
                </div>
              )}

              {/* Quick Action */}
              <Button
                variant={isClockedIn ? "destructive" : "default"}
                size="sm"
                className="w-full"
                onClick={isClockedIn ? onClockOut : onClockIn}
              >
                {isClockedIn ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Clock Out
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Clock In
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Expanded State - Full info */}
        {size === "expanded" && (
          <div className="w-[320px]">
            {/* Header */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex items-center justify-between px-4 py-3 bg-muted/50 cursor-grab active:cursor-grabbing border-b"
            >
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold">KPR Monitor</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7"
                  onClick={cycleSize}
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Status Card */}
              <div
                className={`
                p-4 rounded-xl border
                ${
                  isClockedIn
                    ? "bg-success/5 border-success/20"
                    : "bg-muted/50 border-border"
                }
              `}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${isClockedIn ? "bg-success/20" : "bg-muted"}
                    `}
                    >
                      {isClockedIn ? (
                        <Timer className="w-5 h-5 text-success" />
                      ) : (
                        <Clock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {isClockedIn ? "Currently Working" : "Not Clocked In"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isClockedIn && clockInTime
                          ? `Started at ${formatTime(clockInTime)}`
                          : "Ready to start"}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`status-indicator ${
                      isClockedIn ? "status-online" : "status-offline"
                    }`}
                  />
                </div>

                {isClockedIn && (
                  <div className="text-center py-2">
                    <p className="text-3xl font-mono font-bold tabular-nums text-success">
                      {elapsedTime}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Session Duration
                    </p>
                  </div>
                )}
              </div>

              {/* Location Info */}
              {isClockedIn && currentLocation && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{currentLocation}</p>
                    {locationCategory && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {locationCategory}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Weekly Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Weekly Progress</span>
                  <div className="flex items-center gap-2">
                    {isCompliant ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-warning" />
                    )}
                    <span className="font-medium">
                      {weeklyProgress.daysWorked}/{weeklyProgress.requiredDays}{" "}
                      days
                    </span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-bar-fill ${
                      isCompliant ? "success" : "warning"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (weeklyProgress.daysWorked /
                          weeklyProgress.requiredDays) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Action Button */}
              <Button
                variant={isClockedIn ? "destructive" : "default"}
                size="lg"
                className="w-full"
                onClick={isClockedIn ? onClockOut : onClockIn}
              >
                {isClockedIn ? (
                  <>
                    <Square className="w-5 h-5 mr-2" />
                    Clock Out
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Clock In
                  </>
                )}
              </Button>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-muted/30 border-t text-center">
              <p className="text-xs text-muted-foreground">
                Drag to reposition • Click minimize to shrink
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

// Hook to manage monitor visibility
export function useDesktopMonitor() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show on desktop
    const isDesktop = window.innerWidth >= 1024
    const savedVisibility = localStorage.getItem("monitor-visible")
    setIsVisible(isDesktop && savedVisibility !== "false")
  }, [])

  const show = () => {
    setIsVisible(true)
    localStorage.setItem("monitor-visible", "true")
  }

  const hide = () => {
    setIsVisible(false)
    localStorage.setItem("monitor-visible", "false")
  }

  const toggle = () => {
    if (isVisible) {
      hide()
    } else {
      show()
    }
  }

  return { isVisible, show, hide, toggle }
}
