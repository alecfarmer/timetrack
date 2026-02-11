"use client"

import { useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useTimer } from "@/hooks/use-timer"
import { useLongPress } from "@/hooks/use-long-press"
import { Coffee, Zap, Check, Loader2, Play, AlertTriangle } from "lucide-react"
import { fadeUp, scaleIn } from "@/lib/animations"

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

  const targetSeconds = targetHours * 60 * 60
  const progress = useMemo(() => {
    if (!startTime || totalSeconds === 0) return 0
    return Math.min(100, (totalSeconds / targetSeconds) * 100)
  }, [totalSeconds, targetSeconds, startTime])

  const xpEarned = useMemo(() => {
    if (startTime && !isOnBreak) return Math.floor(totalSeconds / 60)
    return 0
  }, [totalSeconds, startTime, isOnBreak])

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

  const longPress = useLongPress({
    duration: 3000,
    onLongPress: handleClockOut,
    onTap: !isClockedIn ? handleClockIn : undefined,
    onProgress: setHoldProgress,
    disabled: disabled || actionState !== "idle",
  })

  // Ring sizing
  const config = {
    container: "w-64 h-64 sm:w-72 sm:h-72",
    text: "text-4xl sm:text-5xl",
    subtext: "text-sm",
    ring: 115,
    stroke: 8,
  }
  const radius = config.ring
  const circumference = 2 * Math.PI * radius

  // Work progress ring offset
  const workStrokeDashoffset = circumference - (progress / 100) * circumference

  // Hold progress ring (separate overlay ring)
  const holdRadius = radius + 14
  const holdCircumference = 2 * Math.PI * holdRadius
  const holdStrokeDashoffset = holdCircumference - holdProgress * holdCircumference

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

  const getBorderGlow = () => {
    if (longPress.isPressed) return "shadow-[0_0_30px_-5px_hsl(0_72%_51%/0.5)]"
    if (!isClockedIn && actionState === "idle") return "shadow-[0_0_25px_-5px_hsl(152_60%_40%/0.3)]"
    return ""
  }

  return (
    <div className={cn("flex flex-col items-center select-none touch-none", className)}>
      {/* Interactive Timer Ring */}
      <div
        className={cn(
          "relative cursor-pointer transition-shadow duration-300 rounded-full",
          config.container,
          getBorderGlow(),
          longPress.isPressed && "scale-[0.97] transition-transform duration-150"
        )}
        {...longPress.handlers}
      >
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox={`0 0 ${(holdRadius + 4) * 2} ${(holdRadius + 4) * 2}`}
        >
          {/* Hold progress ring (outermost) */}
          {isClockedIn && holdProgress > 0 && (
            <motion.circle
              cx={holdRadius + 4}
              cy={holdRadius + 4}
              r={holdRadius}
              fill="none"
              className="stroke-red-500"
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={holdCircumference}
              strokeDashoffset={holdStrokeDashoffset}
              opacity={0.8}
            />
          )}

          {/* Background ring */}
          <circle
            cx={holdRadius + 4}
            cy={holdRadius + 4}
            r={radius}
            fill="none"
            className="stroke-muted"
            strokeWidth={config.stroke}
          />
          {/* Work progress ring */}
          <motion.circle
            cx={holdRadius + 4}
            cy={holdRadius + 4}
            r={radius}
            fill="none"
            className={cn("transition-colors duration-500", getProgressColor())}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: workStrokeDashoffset }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />

          {/* Tap/hold pulse ring when not clocked in */}
          {!isClockedIn && actionState === "idle" && !disabled && (
            <motion.circle
              cx={holdRadius + 4}
              cy={holdRadius + 4}
              r={radius}
              fill="none"
              className="stroke-primary"
              strokeWidth={2}
              strokeDasharray={circumference}
              strokeDashoffset={0}
              opacity={0.3}
              animate={{
                opacity: [0.1, 0.3, 0.1],
                strokeWidth: [2, 4, 2],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {actionState === "loading" ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-2"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Processing...</p>
              </motion.div>
            ) : actionState === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
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
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
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
                <motion.div
                  key={formatted}
                  initial={{ opacity: 0.8, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "font-bold tabular-nums tracking-tight transition-colors duration-300",
                    config.text,
                    getTextColor()
                  )}
                >
                  {startTime ? formatted : "00:00:00"}
                </motion.div>

                {/* Status text */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={isOnBreak ? "break" : startTime ? "working" : "ready"}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className={cn("text-muted-foreground mt-1 flex items-center gap-1.5", config.subtext)}
                  >
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
                  </motion.p>
                </AnimatePresence>

                {/* Action hint */}
                {actionState === "idle" && !disabled && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-3"
                  >
                    {!isClockedIn ? (
                      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10">
                        <Play className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold text-primary">Tap to Clock In</span>
                      </div>
                    ) : longPress.isPressed ? (
                      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10">
                        <span className="text-xs font-semibold text-red-500">
                          {Math.ceil(3 - holdProgress * 3)}s — Hold to Clock Out
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted">
                        <span className="text-xs font-medium text-muted-foreground">Hold to Clock Out</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {disabled && !isClockedIn && (
                  <p className="text-xs text-muted-foreground mt-3">Select a location first</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* XP Counter */}
      {startTime && !isOnBreak && xpEarned > 0 && (
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium"
        >
          <Zap className="h-3.5 w-3.5" />
          +{xpEarned} XP earned
        </motion.div>
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
