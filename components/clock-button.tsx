"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion"
import { Loader2, ArrowRight, Check, Play, Square } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClockButtonProps {
  isClockedIn: boolean
  onClockIn: () => Promise<void>
  onClockOut: () => Promise<void>
  disabled?: boolean
  variant?: "default" | "modern"
}

export function ClockButton({ isClockedIn, onClockIn, onClockOut, disabled, variant = "default" }: ClockButtonProps) {
  const [loading, setLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const constraintsRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const buttonWidth = 280
  const threshold = buttonWidth * 0.65

  // Transform x position to background width percentage
  const backgroundWidth = useTransform(x, [0, threshold], ["0%", "100%"])
  const textOpacity = useTransform(x, [0, threshold * 0.3], [1, 0])
  const arrowOpacity = useTransform(x, [threshold * 0.7, threshold], [1, 0])
  const checkOpacity = useTransform(x, [threshold * 0.7, threshold], [0, 1])

  const handleClockIn = async () => {
    if (loading || disabled) return

    setLoading(true)
    try {
      await onClockIn()
      setIsComplete(true)
      setTimeout(() => setIsComplete(false), 1000)
    } finally {
      setLoading(false)
    }
  }

  const handleClockOut = async () => {
    if (loading || disabled) return

    setLoading(true)
    try {
      await onClockOut()
      setIsComplete(true)
      setTimeout(() => setIsComplete(false), 1000)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async () => {
    if (x.get() >= threshold) {
      setLoading(true)
      try {
        await onClockOut()
        setIsComplete(true)
        setTimeout(() => setIsComplete(false), 1000)
      } finally {
        setLoading(false)
      }
    }
  }

  // Modern variant - simpler, cleaner design
  if (variant === "modern") {
    if (!isClockedIn) {
      return (
        <motion.button
          className={cn(
            "relative w-full h-12 rounded-xl font-medium text-sm",
            "bg-emerald-500 text-white",
            "hover:bg-emerald-600 active:bg-emerald-700",
            "transition-colors",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none"
          )}
          onClick={handleClockIn}
          disabled={disabled || loading}
          whileTap={{ scale: 0.98 }}
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
              </motion.div>
            ) : isComplete ? (
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
          "transition-colors"
        )}
        onClick={handleClockOut}
        disabled={loading}
        whileTap={{ scale: 0.98 }}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
            </motion.div>
          ) : isComplete ? (
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

  // Default variant - original design with swipe to clock out
  // Clock In Button (simple tap)
  if (!isClockedIn) {
    return (
      <motion.button
        className={cn(
          "relative w-full min-h-[72px] rounded-xl text-xl font-semibold",
          "bg-success text-success-foreground",
          "shadow-lg shadow-success/25",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={handleClockIn}
        disabled={disabled || loading}
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.01 }}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center justify-center"
            >
              <Loader2 className="h-7 w-7 animate-spin" />
            </motion.div>
          ) : isComplete ? (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.4 }}
              >
                <Check className="h-8 w-8" />
              </motion.div>
            </motion.div>
          ) : (
            <motion.span
              key="text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              CLOCK IN
            </motion.span>
          )}
        </AnimatePresence>

        {/* Ripple effect on tap */}
        <motion.div
          className="absolute inset-0 rounded-xl bg-white/20"
          initial={{ scale: 0, opacity: 0.5 }}
          whileTap={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.4 }}
        />
      </motion.button>
    )
  }

  // Clock Out Button (swipe to confirm)
  return (
    <div
      ref={constraintsRef}
      className={cn(
        "relative w-full min-h-[72px] rounded-xl overflow-hidden",
        "bg-destructive/20 border-2 border-destructive/30",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Sliding background */}
      <motion.div
        className="absolute inset-y-0 left-0 bg-destructive/30 rounded-l-xl"
        style={{ width: backgroundWidth }}
      />

      {/* Text label */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: textOpacity }}
      >
        <span className="text-lg font-medium text-destructive ml-12">
          Slide to clock out
        </span>
      </motion.div>

      {/* Draggable thumb */}
      <motion.div
        drag={!loading && !disabled ? "x" : false}
        dragConstraints={{ left: 0, right: buttonWidth - 64 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={cn(
          "absolute left-1 top-1 bottom-1 w-14 rounded-lg",
          "bg-destructive text-destructive-foreground",
          "flex items-center justify-center",
          "cursor-grab active:cursor-grabbing",
          "shadow-lg"
        )}
        whileDrag={{ scale: 1.05 }}
        whileTap={{ scale: 1.02 }}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className="h-5 w-5 animate-spin" />
            </motion.div>
          ) : (
            <>
              <motion.div
                key="arrow"
                style={{ opacity: arrowOpacity }}
                className="absolute"
              >
                <ArrowRight className="h-6 w-6" />
              </motion.div>
              <motion.div
                key="check"
                style={{ opacity: checkOpacity }}
                className="absolute"
              >
                <Check className="h-6 w-6" />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
