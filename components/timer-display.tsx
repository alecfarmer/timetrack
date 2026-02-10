"use client"

import { useTimer } from "@/hooks/use-timer"
import { formatTimer } from "@/lib/dates"
import { Clock, Coffee } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimerDisplayProps {
  startTime?: Date | null
  label?: string
  isOnBreak?: boolean
  breakStartTime?: Date | null
  size?: "default" | "large"
}

export function TimerDisplay({ startTime, label, isOnBreak, breakStartTime, size = "default" }: TimerDisplayProps) {
  const { seconds, isRunning } = useTimer(startTime || undefined)
  const { seconds: breakSeconds } = useTimer(isOnBreak && breakStartTime ? breakStartTime : undefined)

  const isLarge = size === "large"

  if (!startTime) {
    return (
      <div className={cn(
        "flex flex-col",
        isLarge ? "items-start" : "items-center gap-2 flex-row"
      )}>
        {!isLarge && <Clock className="h-4 w-4 text-muted-foreground" />}
        <span className={cn(
          "font-mono tabular-nums text-muted-foreground",
          isLarge ? "text-5xl sm:text-6xl font-light tracking-tight" : "text-lg"
        )}>
          00:00:00
        </span>
        {label && (
          <p className={cn(
            "text-muted-foreground",
            isLarge ? "text-sm mt-2" : "text-sm"
          )}>
            {label}
          </p>
        )}
      </div>
    )
  }

  if (isOnBreak) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Coffee className="h-4 w-4 text-warning animate-pulse" />
          <span className="font-mono text-lg font-medium text-warning">{formatTimer(breakSeconds)}</span>
          <span className="text-sm text-warning">on break</span>
        </div>
        <div className="flex items-center gap-2 opacity-60">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono text-sm text-muted-foreground">{formatTimer(seconds)}</span>
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
        </div>
      </div>
    )
  }

  if (isLarge) {
    return (
      <div>
        <span className="font-mono text-5xl sm:text-6xl font-light tracking-tight tabular-nums">
          {formatTimer(seconds)}
        </span>
        {label && (
          <p className="text-sm text-muted-foreground mt-2">{label}</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Clock className={cn("h-4 w-4", isRunning ? "text-success animate-pulse" : "text-muted-foreground")} />
      <span className="font-mono text-lg font-medium">{formatTimer(seconds)}</span>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  )
}
