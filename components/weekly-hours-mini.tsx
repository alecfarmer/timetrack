"use client"

import { cn } from "@/lib/utils"
import { BarChart3 } from "lucide-react"

interface WeekDay {
  date: string
  dayOfWeek: string
  worked: boolean
  minutes: number
}

interface WeeklyHoursMiniProps {
  weekDays?: WeekDay[] | null
}

export function WeeklyHoursMini({ weekDays }: WeeklyHoursMiniProps) {
  // Use Mon–Fri (indices vary; filter by dayOfWeek)
  const days = weekDays?.slice(0, 5) ?? []
  const maxMinutes = Math.max(...days.map((d) => d.minutes), 480) // 8h baseline

  return (
    <div className="card-elevated p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">This Week&apos;s Hours</span>
      </div>

      <div className="flex items-end gap-2 flex-1 min-h-0">
        {days.map((day, i) => {
          const hours = day.minutes / 60
          const pct = maxMinutes > 0 ? (day.minutes / maxMinutes) * 100 : 0

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                {hours > 0 ? `${hours.toFixed(1)}h` : "–"}
              </span>
              <div className="w-full h-24 bg-muted rounded-md relative overflow-hidden">
                <div
                  className={cn(
                    "absolute bottom-0 left-0 right-0 rounded-md transition-all",
                    day.worked ? "bg-primary/80" : "bg-muted-foreground/15"
                  )}
                  style={{ height: `${Math.max(pct, day.worked ? 8 : 0)}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  day.worked ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {day.dayOfWeek.slice(0, 3)}
              </span>
            </div>
          )
        })}
      </div>

      {days.length > 0 && (
        <div className="mt-3 pt-3 border-t text-center">
          <span className="text-xs text-muted-foreground">
            Total:{" "}
            <span className="font-semibold text-foreground">
              {(days.reduce((sum, d) => sum + d.minutes, 0) / 60).toFixed(1)}h
            </span>
          </span>
        </div>
      )}
    </div>
  )
}
