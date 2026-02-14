"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useTimer } from "@/hooks/use-timer"
import { Coffee, Check, Loader2, AlertTriangle } from "lucide-react"

const HOLD_DURATION = 3000 // 3 seconds

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
  const [holdProgress, setHoldProgress] = useState(0)
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdStartRef = useRef<number>(0)
  const holdTriggeredRef = useRef(false)

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

  const clearHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current)
      holdTimerRef.current = null
    }
    holdStartRef.current = 0
    holdTriggeredRef.current = false
    setHoldProgress(0)
  }, [])

  const startHold = useCallback(() => {
    if (actionState !== "idle" || disabled) return
    const action = isClockedIn ? handleClockOut : handleClockIn
    holdStartRef.current = Date.now()
    holdTriggeredRef.current = false
    setHoldProgress(0)

    if (navigator.vibrate) navigator.vibrate(10)

    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current
      const pct = Math.min(100, (elapsed / HOLD_DURATION) * 100)
      setHoldProgress(pct)

      if (pct >= 100 && !holdTriggeredRef.current) {
        holdTriggeredRef.current = true
        if (navigator.vibrate) navigator.vibrate([30, 30, 60])
        clearHold()
        action()
      }
    }, 16)
  }, [actionState, disabled, isClockedIn, handleClockIn, handleClockOut, clearHold])

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current)
    }
  }, [])

  // Ring sizing
  const ringSize = 120
  const strokeWidth = 8
  const holdStrokeWidth = 6
  const radius = (ringSize - strokeWidth) / 2
  const holdRadius = radius - (strokeWidth / 2 + holdStrokeWidth / 2 + 2)
  const circumference = 2 * Math.PI * radius
  const holdCircumference = 2 * Math.PI * holdRadius
  const viewBox = ringSize
  const center = viewBox / 2

  const workStrokeDashoffset = circumference - (progress / 100) * circumference
  const holdStrokeDashoffset = holdCircumference - (holdProgress / 100) * holdCircumference

  const isHolding = holdProgress > 0

  const getProgressColor = () => {
    if (isOnBreak) return "stroke-amber-500"
    if (progress >= 100) return "stroke-emerald-500"
    if (progress >= 75) return "stroke-blue-500"
    return "stroke-primary"
  }

  const getTextColor = () => {
    if (isHolding) return isClockedIn ? "text-rose-500" : "text-primary"
    if (!startTime) return "text-muted-foreground/40"
    if (isOnBreak) return "text-amber-500"
    if (progress >= 100) return "text-emerald-500"
    return "text-foreground"
  }

  const canInteract = actionState === "idle" && !disabled

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Timer Ring — hold to clock in/out */}
      <div
        className={cn(
          "relative w-64 h-64 sm:w-72 sm:h-72 select-none touch-none",
          canInteract && "cursor-pointer"
        )}
        onPointerDown={canInteract ? startHold : undefined}
        onPointerUp={clearHold}
        onPointerLeave={clearHold}
        onPointerCancel={clearHold}
        onContextMenu={(e) => e.preventDefault()}
      >
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
          {/* Hold progress ring (inner) */}
          {isHolding && (
            <circle
              cx={center}
              cy={center}
              r={holdRadius}
              fill="none"
              className={isClockedIn ? "stroke-rose-500" : "stroke-primary"}
              strokeWidth={holdStrokeWidth}
              strokeLinecap="round"
              strokeDasharray={holdCircumference}
              strokeDashoffset={holdStrokeDashoffset}
              opacity={0.8}
            />
          )}
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
                {/* Time display */}
                <span
                  className={cn(
                    "font-bold tabular-nums tracking-tight text-5xl sm:text-6xl transition-colors duration-300",
                    getTextColor()
                  )}
                >
                  {startTime ? formatted : "00:00:00"}
                </span>

                {/* Status text */}
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  {isHolding ? (
                    <span className={isClockedIn ? "text-rose-500" : "text-primary"}>
                      {isClockedIn ? "Release to cancel..." : "Hold..."}
                    </span>
                  ) : !startTime ? (
                    "Hold to clock in"
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

        {/* Pulse effect while holding */}
        {isHolding && (
          <motion.div
            className={cn(
              "absolute inset-2 rounded-full border-2",
              isClockedIn ? "border-rose-500/30" : "border-primary/30"
            )}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>

      {/* Hold hint for clocked-in state */}
      {isClockedIn && actionState === "idle" && !isHolding && (
        <p className="mt-2 text-xs text-muted-foreground">Hold to clock out</p>
      )}

      {/* Target progress */}
      {startTime && !isHolding && (
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
