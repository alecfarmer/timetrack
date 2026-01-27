"use client"

import { useTimer } from "@/hooks/use-timer"
import { formatTimer } from "@/lib/dates"
import { Clock } from "lucide-react"

interface TimerDisplayProps {
  startTime?: Date | null
  label?: string
}

export function TimerDisplay({ startTime, label }: TimerDisplayProps) {
  const { seconds, isRunning } = useTimer(startTime || undefined)

  if (!startTime) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span className="font-mono text-lg">--:--:--</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Clock className={`h-4 w-4 ${isRunning ? "text-success animate-pulse" : "text-muted-foreground"}`} />
      <span className="font-mono text-lg font-medium">{formatTimer(seconds)}</span>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  )
}
