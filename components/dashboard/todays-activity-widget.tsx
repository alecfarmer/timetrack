"use client"

import { Widget, ActivityWidget } from "@/components/dashboard/widget-grid"
import { Clock, ArrowDownRight, ArrowUpRight, Coffee } from "lucide-react"
import { formatTime } from "@/lib/dates"

export function TodaysActivityWidget({ entries, showAll, setShowAll }: { entries: any[]; showAll: boolean; setShowAll: (v: boolean) => void }) {
  const displayedEntries = showAll ? entries : entries.slice(0, 3)

  const activityItems = displayedEntries.map((entry: any) => {
    const isClockIn = entry.type === "CLOCK_IN"
    const isBreak = entry.type === "BREAK_START" || entry.type === "BREAK_END"
    return {
      id: entry.id,
      icon: isBreak ? (
        <Coffee className="h-4 w-4" />
      ) : isClockIn ? (
        <ArrowDownRight className="h-4 w-4" />
      ) : (
        <ArrowUpRight className="h-4 w-4" />
      ),
      iconColor: isBreak
        ? "bg-amber-500/10 text-amber-600"
        : isClockIn
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-rose-500/10 text-rose-600",
      title: isBreak
        ? (entry.type === "BREAK_START" ? "Break Started" : "Break Ended")
        : isClockIn ? "Clocked In" : "Clocked Out",
      subtitle: entry.location?.name || "Unknown location",
      timestamp: formatTime(new Date(entry.timestampServer)),
    }
  })

  return (
    <Widget
      title="Today's Activity"
      icon={<Clock className="h-4 w-4 text-blue-500" />}
      action={entries.length > 0 ? { label: `${entries.length} entries` } : undefined}
      noPadding
    >
      {activityItems.length > 0 ? (
        <ActivityWidget
          items={activityItems}
          maxItems={3}
          showAll={showAll}
          onShowAll={() => setShowAll(!showAll)}
        />
      ) : (
        <div className="py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground mt-1">Clock in to get started</p>
        </div>
      )}
    </Widget>
  )
}
