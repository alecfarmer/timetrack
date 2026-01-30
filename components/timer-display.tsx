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
}

export function TimerDisplay({ startTime, label, isOnBreak, breakStartTime }: TimerDisplayProps) {
  const { seconds, isRunning } = useTimer(startTime || undefined)
  const { seconds: breakSeconds } = useTimer(isOnBreak && breakStartTime ? breakStartTime : undefined)

  if (!startTime) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span className="font-mono text-lg">--:--:--</span>
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

  return (
    <div className="flex items-center gap-2">
      <Clock className={cn("h-4 w-4", isRunning ? "text-success animate-pulse" : "text-muted-foreground")} />
      <span className="font-mono text-lg font-medium">{formatTimer(seconds)}</span>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  )
}
