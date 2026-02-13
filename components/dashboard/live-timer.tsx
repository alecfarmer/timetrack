"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useTimer } from "@/hooks/use-timer"
import { Coffee, Zap } from "lucide-react"
import { fadeUp } from "@/lib/animations"

interface LiveTimerProps {
  startTime: Date | null
  isOnBreak?: boolean
  targetHours?: number // Default 8 hours
  showProgress?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function LiveTimer({
  startTime,
  isOnBreak = false,
  targetHours = 8,
  showProgress = true,
  size = "lg",
  className,
}: LiveTimerProps) {
  const { formatted, seconds: totalSeconds } = useTimer(startTime)
  const [xpEarned, setXpEarned] = useState(0)

  // Calculate progress towards target hours
  const targetSeconds = targetHours * 60 * 60
  const progress = useMemo(() => {
    if (!startTime || totalSeconds === 0) return 0
    return Math.min(100, (totalSeconds / targetSeconds) * 100)
  }, [totalSeconds, targetSeconds, startTime])

  // Simulate XP accumulation (1 XP per minute worked)
  useEffect(() => {
    if (startTime && !isOnBreak) {
      setXpEarned(Math.floor(totalSeconds / 60))
    }
  }, [totalSeconds, startTime, isOnBreak])

  // Size configurations
  const sizes = {
    sm: {
      container: "w-32 h-32",
      text: "text-2xl",
      subtext: "text-xs",
      ring: 56,
      stroke: 4,
    },
    md: {
      container: "w-44 h-44",
      text: "text-3xl",
      subtext: "text-xs",
      ring: 80,
      stroke: 5,
    },
    lg: {
      container: "w-56 h-56",
      text: "text-4xl",
      subtext: "text-sm",
      ring: 100,
      stroke: 6,
    },
    xl: {
      container: "w-72 h-72",
      text: "text-4xl sm:text-5xl",
      subtext: "text-sm",
      ring: 130,
      stroke: 8,
    },
  }

  const config = sizes[size]
  const radius = config.ring
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  // Determine color based on state
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
    <div className={cn("relative flex flex-col items-center", className)}>
      {/* Circular Progress Ring */}
      {showProgress && (
        <div className={cn("relative", config.container)}>
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox={`0 0 ${(radius + config.stroke) * 2} ${(radius + config.stroke) * 2}`}
          >
            {/* Background ring */}
            <circle
              cx={radius + config.stroke}
              cy={radius + config.stroke}
              r={radius}
              fill="none"
              className="stroke-muted"
              strokeWidth={config.stroke}
            />
            {/* Progress ring */}
            <motion.circle
              cx={radius + config.stroke}
              cy={radius + config.stroke}
              r={radius}
              fill="none"
              className={cn("transition-colors duration-500", getProgressColor())}
              strokeWidth={config.stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
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
          </div>
        </div>
      )}

      {/* Without progress ring */}
      {!showProgress && (
        <div className="text-center">
          <motion.p
            className={cn(
              "font-bold tabular-nums tracking-tight transition-colors duration-300",
              config.text,
              getTextColor()
            )}
          >
            {startTime ? formatted : "00:00:00"}
          </motion.p>
          <p className={cn("text-muted-foreground mt-2", config.subtext)}>
            {!startTime ? "Ready to start" : isOnBreak ? "On Break" : "Current Session"}
          </p>
        </div>
      )}

      {/* XP Counter (when working) */}
      {startTime && !isOnBreak && xpEarned > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium"
        >
          <Zap className="h-3.5 w-3.5" />
          +{xpEarned} XP earned
        </motion.div>
      )}

      {/* Target progress indicator */}
      {showProgress && startTime && (
        <div className="mt-3 text-center">
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

// Minimal timer for compact displays
export function LiveTimerCompact({
  startTime,
  isOnBreak,
  className,
}: {
  startTime: Date | null
  isOnBreak?: boolean
  className?: string
}) {
  const { formatted } = useTimer(startTime)

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isOnBreak && <Coffee className="h-4 w-4 text-amber-500" />}
      <span
        className={cn(
          "font-mono font-semibold tabular-nums",
          !startTime && "text-muted-foreground/50",
          isOnBreak && "text-amber-500"
        )}
      >
        {startTime ? formatted : "00:00:00"}
      </span>
    </div>
  )
}
