"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Check, Play, Square, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClockButtonProps {
  isClockedIn: boolean
  onClockIn: () => Promise<void>
  onClockOut: () => Promise<void>
  disabled?: boolean
  className?: string
}

type ButtonState = "idle" | "loading" | "success" | "error"

export function ClockButton({
  isClockedIn,
  onClockIn,
  onClockOut,
  disabled,
  className,
}: ClockButtonProps) {
  const [state, setState] = useState<ButtonState>("idle")

  const handleAction = useCallback(async () => {
    if (state !== "idle" || disabled) return
    setState("loading")
    try {
      if (isClockedIn) {
        await onClockOut()
      } else {
        await onClockIn()
      }
      setState("success")
      setTimeout(() => setState("idle"), 1500)
    } catch {
      setState("error")
      setTimeout(() => setState("idle"), 2000)
    }
  }, [state, disabled, isClockedIn, onClockIn, onClockOut])

  return (
    <motion.button
      className={cn(
        "relative w-full h-12 rounded-xl font-medium text-sm transition-colors",
        isClockedIn
          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
          : "bg-emerald-500 text-white hover:bg-emerald-600",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className
      )}
      onClick={handleAction}
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
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" />
            <span>{isClockedIn ? "Clocked Out" : "Clocked In"}</span>
          </motion.div>
        ) : state === "error" ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Try Again</span>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2"
          >
            {isClockedIn ? <Square className="h-3.5 w-3.5" /> : <Play className="h-4 w-4" />}
            <span>{isClockedIn ? "Clock Out" : "Clock In"}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
