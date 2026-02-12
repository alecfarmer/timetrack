"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Trophy, Medal, Award } from "lucide-react"

interface RankEntry {
  userId: string
  displayName: string
  value: number
  rank: number
}

interface LeaderboardTableProps {
  rankings: RankEntry[]
  currentUserId: string
  category: string
  loading?: boolean
}

const podiumColors = [
  "from-amber-500 to-yellow-500", // 1st
  "from-slate-400 to-slate-300", // 2nd
  "from-amber-700 to-orange-600", // 3rd
]

const podiumIcons = [Trophy, Medal, Award]

export function LeaderboardTable({ rankings, currentUserId, category, loading }: LeaderboardTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  if (rankings.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-muted-foreground">No rankings yet this period</p>
      </div>
    )
  }

  const valueLabel = category === "xp" ? "XP" : category === "streak" ? "days" : "kudos"

  return (
    <div className="space-y-2">
      {/* Top 3 podium */}
      {rankings.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-6 pt-4">
          {[1, 0, 2].map((idx) => {
            const entry = rankings[idx]
            if (!entry) return null
            const Icon = podiumIcons[idx]
            const heights = ["h-28", "h-24", "h-20"]

            return (
              <motion.div
                key={entry.userId}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.15 }}
                className="flex flex-col items-center"
              >
                <div className={cn(
                  "w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center mb-2",
                  podiumColors[idx]
                )}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-xs font-medium text-center max-w-[80px] truncate">
                  {entry.userId === currentUserId ? "You" : `User ${entry.rank}`}
                </p>
                <p className="text-lg font-bold tabular-nums">{entry.value.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{valueLabel}</p>
                <div className={cn(
                  "w-20 rounded-t-lg bg-gradient-to-b mt-2",
                  podiumColors[idx],
                  heights[idx]
                )} />
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Full ranking list */}
      {rankings.map((entry) => {
        const isUser = entry.userId === currentUserId

        return (
          <motion.div
            key={entry.userId}
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: entry.rank * 0.05 }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl transition-colors",
              isUser
                ? "bg-primary/10 border border-primary/30"
                : "bg-muted/30 hover:bg-muted/50"
            )}
          >
            <span className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
              entry.rank <= 3
                ? `bg-gradient-to-br ${podiumColors[entry.rank - 1]} text-white`
                : "bg-muted text-muted-foreground"
            )}>
              {entry.rank}
            </span>

            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium truncate", isUser && "text-primary")}>
                {isUser ? "You" : `Team Member`}
              </p>
            </div>

            <div className="text-right">
              <p className="font-bold tabular-nums">{entry.value.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{valueLabel}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
