"use client"

import { useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useTimer } from "@/hooks/use-timer"
import { Coffee, Check, Loader2, Play, Square, AlertTriangle } from "lucide-react"

type ActionState = "idle" | "loading" | "success" | "error"

interface MobileClockTimerProps {
  startTime: Date | null
  isOnBreak?: boolean
  isClockedIn: boolean
  targetHours?: number
  onClockIn: () => Promise<void>
  onClockOut: () => Promise<void>
  disabled?: boolean
  className?: string
}

export function MobileClockTimer({
  startTime,
  isOnBreak = false,
  isClockedIn,
  targetHours = 8,
  onClockIn,
  onClockOut,
  disabled = false,
  className,
}: MobileClockTimerProps) {
  const { formatted, seconds: totalSeconds } = useTimer(startTime)
  const [actionState, setActionState] = useState<ActionState>("idle")

  const targetSeconds = targetHours * 60 * 60
  const progress = useMemo(() => {
    if (!startTime || totalSeconds === 0) return 0
    return Math.min(100, (totalSeconds / targetSeconds) * 100)
  }, [totalSeconds, targetSeconds, startTime])

  const handleClockIn = useCallback(async () => {
    if (actionState !== "idle" || disabled || isClockedIn) return
    setActionState("loading")
    try {
      await onClockIn()
      setActionState("success")
      if (navigator.vibrate) navigator.vibrate(100)
      setTimeout(() => setActionState("idle"), 1500)
    } catch {
      setActionState("error")
      setTimeout(() => setActionState("idle"), 2000)
    }
  }, [actionState, disabled, isClockedIn, onClockIn])

  const handleClockOut = useCallback(async () => {
    if (actionState !== "idle" || !isClockedIn) return
    setActionState("loading")
    try {
      await onClockOut()
      setActionState("success")
      setTimeout(() => setActionState("idle"), 1500)
    } catch {
      setActionState("error")
      setTimeout(() => setActionState("idle"), 2000)
    }
  }, [actionState, isClockedIn, onClockOut])

  // Ring sizing
  const ringSize = 120
  const strokeWidth = 8
  const radius = (ringSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const viewBox = ringSize
  const center = viewBox / 2

  const workStrokeDashoffset = circumference - (progress / 100) * circumference

  const getProgressColor = () => {
    if (isOnBreak) return "stroke-amber-500"
    if (progress >= 100) return "stroke-emerald-500"
    if (progress >= 75) return "stroke-blue-500"
    return "stroke-primary"
  }

  const getTextColor = () => {
    if (!startTime) return "text-muted-foreground/40"
    if (isOnBreak) return "text-amber-500"
    if (progress >= 100) return "text-emerald-500"
    return "text-foreground"
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Timer Ring */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72">
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox={`0 0 ${viewBox} ${viewBox}`}
        >
          {/* Background ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            className="stroke-muted"
            strokeWidth={strokeWidth}
          />
          {/* Work progress ring */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            className={cn("transition-colors duration-500", getProgressColor())}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: workStrokeDashoffset }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {actionState === "loading" ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Processing...</p>
              </motion.div>
            ) : actionState === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="h-6 w-6 text-emerald-500" strokeWidth={3} />
                </div>
                <p className="text-sm font-semibold text-emerald-500">
                  {isClockedIn ? "Clocked In!" : "Clocked Out!"}
                </p>
              </motion.div>
            ) : actionState === "error" ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2"
              >
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <p className="text-sm text-destructive">Try Again</p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                {/* Time display — large */}
                <span
                  className={cn(
                    "font-bold tabular-nums tracking-tight text-5xl sm:text-6xl transition-colors duration-300",
                    getTextColor()
                  )}
                >
                  {startTime ? formatted : "00:00:00"}
                </span>

                {/* Status text */}
                <p className={cn("text-sm text-muted-foreground mt-1 flex items-center gap-1.5")}>
                  {!startTime ? (
                    "Ready to start"
                  ) : isOnBreak ? (
                    <>
                      <Coffee className="h-3.5 w-3.5 text-amber-500" />
                      On Break
                    </>
                  ) : (
                    "Working"
                  )}
                </p>

                {disabled && !isClockedIn && (
                  <p className="text-xs text-muted-foreground mt-3">Select a location first</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Clock In / Clock Out button below the ring */}
      {actionState === "idle" && !disabled && (
        <div className="mt-4 w-full max-w-[240px]">
          {!isClockedIn ? (
            <button
              onClick={handleClockIn}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Play className="h-4 w-4" />
              Clock In
            </button>
          ) : (
            <button
              onClick={handleClockOut}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-semibold text-sm hover:bg-rose-500/20 transition-colors"
            >
              <Square className="h-3.5 w-3.5" />
              Clock Out
            </button>
          )}
        </div>
      )}

      {/* Target progress */}
      {startTime && (
        <div className="mt-2 text-center">
          <p className="text-xs text-muted-foreground">
            {progress >= 100 ? (
              <span className="text-emerald-500 font-medium">Target reached!</span>
            ) : (
              <>
                {Math.round(progress)}% of {targetHours}h goal
              </>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
