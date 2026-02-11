"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion"
import { Loader2, Check, Play, Square, ChevronRight, Coffee, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  clockButtonPulse,
  clockButtonRipple,
  clockButtonSuccess,
  transitions,
  DURATIONS,
} from "@/lib/animations"

interface ClockButtonProps {
  isClockedIn: boolean
  onClockIn: () => Promise<void>
  onClockOut: () => Promise<void>
  disabled?: boolean
  variant?: "default" | "modern" | "giant"
  isOnBreak?: boolean
  isOvertime?: boolean
  className?: string
}

type ButtonState = "idle" | "loading" | "success" | "error"

export function ClockButton({
  isClockedIn,
  onClockIn,
  onClockOut,
  disabled,
  variant = "giant",
  isOnBreak = false,
  isOvertime = false,
  className,
}: ClockButtonProps) {
  const [state, setState] = useState<ButtonState>("idle")
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const buttonRef = useRef<HTMLButtonElement>(null)
  const constraintsRef = useRef<HTMLDivElement>(null)

  // Swipe tracking
  const x = useMotionValue(0)
  const swipeThreshold = 120
  const backgroundOpacity = useTransform(x, [-swipeThreshold, 0, swipeThreshold], [0.3, 0, 0.3])
  const swipeProgress = useTransform(x, [-swipeThreshold, 0, swipeThreshold], [-1, 0, 1])

  const addRipple = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const id = Date.now()
    setRipples((prev) => [...prev, { id, x, y }])
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id))
    }, 600)
  }, [])

  const handleClockIn = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (state !== "idle" || disabled) return
    if (e) addRipple(e)

    setState("loading")
    try {
      await onClockIn()
      setState("success")
      setTimeout(() => setState("idle"), 1500)
    } catch {
      setState("error")
      setTimeout(() => setState("idle"), 2000)
    }
  }

  const handleClockOut = async () => {
    if (state !== "idle") return

    setState("loading")
    try {
      await onClockOut()
      setState("success")
      setTimeout(() => setState("idle"), 1500)
    } catch {
      setState("error")
      setTimeout(() => setState("idle"), 2000)
    }
  }

  const handleSwipeEnd = async (_: unknown, info: PanInfo) => {
    // Swipe right to clock out
    if (isClockedIn && info.offset.x > swipeThreshold && info.velocity.x > 0) {
      await handleClockOut()
    }
    // Swipe left to clock in (alternative)
    if (!isClockedIn && info.offset.x < -swipeThreshold && info.velocity.x < 0) {
      await handleClockIn()
    }
  }

  // Determine color based on state
  const getColorClasses = () => {
    if (isOvertime) return "from-red-500 to-red-600 shadow-red-500/30"
    if (isOnBreak) return "from-amber-500 to-orange-500 shadow-amber-500/30"
    if (isClockedIn) return "from-blue-500 to-blue-600 shadow-blue-500/30"
    return "from-emerald-500 to-emerald-600 shadow-emerald-500/30"
  }

  const getButtonText = () => {
    if (isOnBreak) return "On Break"
    if (isClockedIn) return "Clocked In"
    return "Clock In"
  }

  const getSuccessText = () => {
    if (isClockedIn) return "Clocked Out!"
    return "Clocked In!"
  }

  // Modern variant - simpler, cleaner design (from original)
  if (variant === "modern") {
    if (!isClockedIn) {
      return (
        <motion.button
          className={cn(
            "relative w-full h-12 rounded-xl font-medium text-sm",
            "bg-emerald-500 text-white",
            "hover:bg-emerald-600 active:bg-emerald-700",
            "transition-colors",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none",
            className
          )}
          onClick={handleClockIn}
          disabled={disabled || state === "loading"}
          whileTap={{ scale: 0.98 }}
        >
          <AnimatePresence mode="wait">
            {state === "loading" ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
              </motion.div>
            ) : state === "success" ? (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>Clocked In</span>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4" />
                <span>Clock In</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      )
    }

    return (
      <motion.button
        className={cn(
          "relative w-full h-12 rounded-xl font-medium text-sm",
          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
          "hover:bg-rose-500/20 active:bg-rose-500/30",
          "transition-colors",
          className
        )}
        onClick={handleClockOut}
        disabled={state === "loading"}
        whileTap={{ scale: 0.98 }}
      >
        <AnimatePresence mode="wait">
          {state === "loading" ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
            </motion.div>
          ) : state === "success" ? (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" />
              <span>Clocked Out</span>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <Square className="h-3.5 w-3.5" />
              <span>Clock Out</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    )
  }

  // Giant variant - hero clock button (new design)
  if (variant === "giant" || variant === "default") {
    return (
      <div ref={constraintsRef} className={cn("relative", className)}>
        {/* Main Clock Button */}
        <motion.button
          ref={buttonRef}
          className={cn(
            "relative w-full overflow-hidden rounded-3xl",
            "min-h-[180px] sm:min-h-[200px]",
            "bg-gradient-to-br text-white font-bold",
            "shadow-xl",
            getColorClasses(),
            disabled && "opacity-50 cursor-not-allowed",
            state === "idle" && !isClockedIn && !disabled && "cursor-pointer"
          )}
          onClick={!isClockedIn ? handleClockIn : undefined}
          disabled={disabled || state === "loading"}
          variants={!isClockedIn && state === "idle" && !disabled ? clockButtonPulse : undefined}
          initial="idle"
          animate={!isClockedIn && state === "idle" && !disabled ? "pulse" : "idle"}
          whileHover={!disabled && state === "idle" ? { scale: 1.02 } : undefined}
          whileTap={!disabled && state === "idle" ? { scale: 0.98 } : undefined}
          drag={isClockedIn && state === "idle" ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleSwipeEnd}
          style={{ x }}
        >
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

          {/* Swipe background indicator */}
          {isClockedIn && (
            <motion.div
              className="absolute inset-0 bg-rose-600"
              style={{ opacity: backgroundOpacity }}
            />
          )}

          {/* Ripple effects */}
          <AnimatePresence>
            {ripples.map((ripple) => (
              <motion.span
                key={ripple.id}
                className="absolute w-4 h-4 bg-white/30 rounded-full pointer-events-none"
                style={{ left: ripple.x - 8, top: ripple.y - 8 }}
                variants={clockButtonRipple}
                initial="initial"
                animate="animate"
              />
            ))}
          </AnimatePresence>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full py-8">
            <AnimatePresence mode="wait">
              {state === "loading" ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-16 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                  <p className="text-lg opacity-80">Processing...</p>
                </motion.div>
              ) : state === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={transitions.springBouncy}
                  className="flex flex-col items-center gap-4"
                >
                  <motion.div
                    variants={clockButtonSuccess}
                    initial="initial"
                    animate="animate"
                    className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center"
                  >
                    <Check className="h-10 w-10" strokeWidth={3} />
                  </motion.div>
                  <p className="text-2xl font-bold">{getSuccessText()}</p>
                </motion.div>
              ) : state === "error" ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                    <AlertTriangle className="h-10 w-10" />
                  </div>
                  <p className="text-xl font-bold">Try Again</p>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3"
                >
                  {/* Status Icon */}
                  <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                    {isOnBreak ? (
                      <Coffee className="h-10 w-10" />
                    ) : isClockedIn ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <div className="w-4 h-4 rounded-full bg-white" />
                      </motion.div>
                    ) : (
                      <Play className="h-10 w-10 ml-1" />
                    )}
                  </div>

                  {/* Main Text */}
                  <div className="text-center">
                    <p className="text-3xl sm:text-4xl font-bold tracking-tight">
                      {getButtonText()}
                    </p>
                    {!isClockedIn && !disabled && (
                      <p className="text-sm opacity-70 mt-2">Tap to start your day</p>
                    )}
                    {isClockedIn && !isOnBreak && (
                      <p className="text-sm opacity-70 mt-2">Swipe right to clock out</p>
                    )}
                  </div>

                  {/* Swipe indicator when clocked in */}
                  {isClockedIn && state === "idle" && (
                    <motion.div
                      className="flex items-center gap-1 mt-2 opacity-60"
                      animate={{ x: [0, 8, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ChevronRight className="h-4 w-4" />
                      <ChevronRight className="h-4 w-4 -ml-2" />
                      <ChevronRight className="h-4 w-4 -ml-2" />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Overtime warning indicator */}
          {isOvertime && (
            <motion.div
              className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-sm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertTriangle className="h-4 w-4" />
              Overtime
            </motion.div>
          )}

          {/* Break indicator */}
          {isOnBreak && (
            <motion.div
              className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Coffee className="h-4 w-4" />
              Break Time
            </motion.div>
          )}
        </motion.button>

      </div>
    )
  }

  return null
}

// Compact variant for widgets
export function ClockButtonCompact({
  isClockedIn,
  onClockIn,
  onClockOut,
  disabled,
  isOnBreak,
  className,
}: Omit<ClockButtonProps, "variant">) {
  const [loading, setLoading] = useState(false)

  const handleAction = async () => {
    if (loading || disabled) return
    setLoading(true)
    try {
      if (isClockedIn) {
        await onClockOut()
      } else {
        await onClockIn()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.button
      className={cn(
        "relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium",
        isClockedIn
          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
          : "bg-emerald-500 text-white hover:bg-emerald-600",
        isOnBreak && "bg-amber-500/10 text-amber-600 border-amber-500/20",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleAction}
      disabled={disabled || loading}
      whileTap={{ scale: 0.98 }}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {isClockedIn ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span>{isClockedIn ? "Clock Out" : "Clock In"}</span>
        </>
      )}
    </motion.button>
  )
}
