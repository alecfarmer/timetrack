"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Widget, ActivityWidget } from "@/components/dashboard/widget-grid"
import { Clock, ArrowDownRight, ArrowUpRight, Coffee, ChevronDown } from "lucide-react"
import { formatTime } from "@/lib/dates"
import { cn } from "@/lib/utils"

function MobileActivityTimeline({ entries, showAll, setShowAll }: { entries: any[]; showAll: boolean; setShowAll: (v: boolean) => void }) {
  const displayedEntries = showAll ? entries : entries.slice(0, 3)

  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card border p-6"
      >
        <div className="flex flex-col items-center py-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Clock in to get started</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card border overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-semibold">Today&apos;s Activity</span>
        </div>
        <span className="text-xs text-muted-foreground">{entries.length} {entries.length === 1 ? "entry" : "entries"}</span>
      </div>

      <div className="px-4 pb-2">
        <AnimatePresence>
          {displayedEntries.map((entry: any, index: number) => {
            const isClockIn = entry.type === "CLOCK_IN"
            const isBreak = entry.type === "BREAK_START" || entry.type === "BREAK_END"
            const isLast = index === displayedEntries.length - 1

            const icon = isBreak ? (
              <Coffee className="h-3.5 w-3.5" />
            ) : isClockIn ? (
              <ArrowDownRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5" />
            )

            const color = isBreak
              ? "bg-amber-500 text-white"
              : isClockIn
                ? "bg-emerald-500 text-white"
                : "bg-rose-500 text-white"

            const label = isBreak
              ? (entry.type === "BREAK_START" ? "Break Started" : "Break Ended")
              : isClockIn ? "Clocked In" : "Clocked Out"

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 relative"
              >
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-[13px] top-8 bottom-0 w-px bg-border" />
                )}

                {/* Dot */}
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1.5", color)}>
                  {icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatTime(entry.timestampServer)}
                    </span>
                  </div>
                  {entry.location?.name && (
                    <span className="text-xs text-muted-foreground">{entry.location.name}</span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {entries.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full flex items-center justify-center gap-1.5 py-3 border-t text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
        >
          {showAll ? "Show less" : `Show ${entries.length - 3} more`}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showAll && "rotate-180")} />
        </button>
      )}
    </motion.div>
  )
}

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
      timestamp: formatTime(entry.timestampServer),
    }
  })

  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden">
        <MobileActivityTimeline entries={entries} showAll={showAll} setShowAll={setShowAll} />
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
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
      </div>
    </>
  )
}
