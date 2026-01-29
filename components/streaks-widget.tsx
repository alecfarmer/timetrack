"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flame, Trophy, Target, Zap, Award } from "lucide-react"
import { cn } from "@/lib/utils"

interface BadgeData {
  id: string
  name: string
  description: string
  icon: string
  earnedAt: string | null
}

interface StreakData {
  currentStreak: number
  longestStreak: number
  totalOnsiteDays: number
  totalHours: number
  thisMonthDays: number
  perfectWeeks: number
  badges: BadgeData[]
}

export function StreaksWidget() {
  const [data, setData] = useState<StreakData | null>(null)
  const [showBadges, setShowBadges] = useState(false)

  useEffect(() => {
    fetch("/api/streaks")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
  }, [])

  if (!data) return null

  const earnedBadges = data.badges.filter((b) => b.earnedAt)
  const nextBadge = data.badges.find((b) => !b.earnedAt)

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
      <CardContent className="p-4">
        {/* Streak display */}
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            data.currentStreak > 0 ? "bg-amber-500/15" : "bg-muted"
          )}>
            <Flame className={cn(
              "h-6 w-6",
              data.currentStreak >= 10 ? "text-red-500" :
              data.currentStreak >= 5 ? "text-orange-500" :
              data.currentStreak > 0 ? "text-amber-500" : "text-muted-foreground"
            )} />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tabular-nums">{data.currentStreak}</span>
              <span className="text-sm text-muted-foreground">day streak</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Best: {data.longestStreak} days
            </p>
          </div>
          <button
            onClick={() => setShowBadges(!showBadges)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
          >
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-500">{earnedBadges.length}</span>
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold tabular-nums">{data.totalOnsiteDays}</p>
            <p className="text-[10px] text-muted-foreground">On-Site</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold tabular-nums">{data.totalHours}h</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold tabular-nums">{data.perfectWeeks}</p>
            <p className="text-[10px] text-muted-foreground">Perfect Wks</p>
          </div>
        </div>

        {/* Next badge progress */}
        {nextBadge && !showBadges && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-dashed">
            <span className="text-lg">{nextBadge.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{nextBadge.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{nextBadge.description}</p>
            </div>
            <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
        )}

        {/* Badge grid */}
        {showBadges && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="space-y-2"
          >
            <div className="grid grid-cols-4 gap-2">
              {data.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg text-center transition-all",
                    badge.earnedAt ? "bg-amber-500/10" : "bg-muted/30 opacity-40 grayscale"
                  )}
                  title={`${badge.name}: ${badge.description}`}
                >
                  <span className="text-xl">{badge.icon}</span>
                  <span className="text-[9px] font-medium leading-tight">{badge.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
