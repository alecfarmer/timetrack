"use client"

import { motion } from "framer-motion"
import { Widget } from "@/components/dashboard/widget-grid"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useLiveXP, useRealtime } from "@/contexts/realtime-context"
import { Award, Flame, Sparkles, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

function getBadgeEmoji(badge: string): string {
  const badges: Record<string, string> = {
    early_bird: "\u{1F426}",
    night_owl: "\u{1F989}",
    streak_7: "\u{1F525}",
    streak_30: "\u{1F4AF}",
    century: "\u{1F4AF}",
    perfect_week: "\u2B50",
    iron_will: "\u{1F4AA}",
  }
  return badges[badge] || "\u{1F3C6}"
}

function MobileXPCard() {
  const { totalXP, sessionXP, level, xpToNext, xpProgress } = useLiveXP()
  const { recentBadges, currentStreak } = useRealtime()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card border overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Level badge */}
          <motion.div
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-amber-500/20 flex-shrink-0"
            whileTap={{ scale: 0.95 }}
          >
            {level}
          </motion.div>

          {/* XP info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Level {level}</span>
              {currentStreak > 0 && (
                <Badge variant="secondary" className="gap-0.5 text-[10px] h-5 bg-orange-500/10 text-orange-600 border-orange-500/20">
                  <Flame className="h-2.5 w-2.5" />
                  {currentStreak}
                </Badge>
              )}
              {sessionXP > 0 && (
                <span className="text-[10px] font-medium text-amber-600 flex items-center gap-0.5">
                  <Sparkles className="h-2.5 w-2.5" />
                  +{sessionXP}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <span className="text-[10px] tabular-nums text-muted-foreground flex-shrink-0">{xpToNext} XP</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{totalXP.toLocaleString()} XP total</p>
          </div>
        </div>

        {/* Recent badges */}
        {recentBadges.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <div className="flex gap-1.5 flex-1">
              {recentBadges.slice(0, 4).map((badge, i) => (
                <motion.div
                  key={badge}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm"
                  title={badge}
                >
                  {getBadgeEmoji(badge)}
                </motion.div>
              ))}
            </div>
            <Link
              href="/rewards"
              className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              All
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function XPWidget() {
  const { totalXP, sessionXP, level, xpToNext, xpProgress } = useLiveXP()
  const { recentBadges, currentStreak } = useRealtime()

  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden">
        <MobileXPCard />
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <Widget
          title="Progress & Rewards"
          icon={<Award className="h-4 w-4 text-amber-500" />}
          action={{ label: "View all", href: "/rewards" }}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <motion.div
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-amber-500/25"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                {level}
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">Level {level}</p>
                  {currentStreak > 0 && (
                    <Badge variant="secondary" className="gap-1 bg-orange-500/10 text-orange-600 border-orange-500/20">
                      <Flame className="h-3 w-3" />
                      {currentStreak}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{totalXP.toLocaleString()} XP</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Next level</span>
                <span className="font-medium text-amber-600">{xpToNext} XP</span>
              </div>
              <Progress value={xpProgress} className="h-2" />
            </div>

            {sessionXP > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500/10 text-amber-600"
              >
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">+{sessionXP} XP this session</span>
              </motion.div>
            )}

            {recentBadges.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Recent Badges</p>
                <div className="flex gap-2">
                  {recentBadges.slice(0, 4).map((badge, i) => (
                    <motion.div
                      key={badge}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg"
                      title={badge}
                    >
                      {getBadgeEmoji(badge)}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Widget>
      </div>
    </>
  )
}
